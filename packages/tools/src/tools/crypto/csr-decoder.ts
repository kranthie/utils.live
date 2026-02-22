import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("PEM-encoded CSR (Certificate Signing Request)"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded CSR information"),
});

/**
 * Basic ASN.1 DER parser for CSR decoding.
 */
function parseAsn1(
  data: Uint8Array,
  offset: number
): { tag: number; length: number; value: Uint8Array; end: number } {
  const tag = data[offset]!;
  let length = data[offset + 1]!;
  let headerLen = 2;

  if (length & 0x80) {
    const numBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | data[offset + 2 + i]!;
    }
    headerLen = 2 + numBytes;
  }

  const start = offset + headerLen;
  const value = data.slice(start, start + length);
  return { tag, length, value, end: start + length };
}

function readOid(bytes: Uint8Array): string {
  const parts: number[] = [];
  parts.push(Math.floor(bytes[0]! / 40));
  parts.push(bytes[0]! % 40);

  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i]! & 0x7f);
    if (!(bytes[i]! & 0x80)) {
      parts.push(value);
      value = 0;
    }
  }

  return parts.join(".");
}

function oidToName(oid: string): string {
  const names: Record<string, string> = {
    "2.5.4.3": "Common Name (CN)",
    "2.5.4.6": "Country (C)",
    "2.5.4.7": "Locality (L)",
    "2.5.4.8": "State (ST)",
    "2.5.4.10": "Organization (O)",
    "2.5.4.11": "Organizational Unit (OU)",
    "1.2.840.113549.1.1.1": "RSA",
    "1.2.840.113549.1.1.5": "SHA-1 with RSA",
    "1.2.840.113549.1.1.11": "SHA-256 with RSA",
    "1.2.840.113549.1.1.12": "SHA-384 with RSA",
    "1.2.840.113549.1.1.13": "SHA-512 with RSA",
    "1.2.840.10045.2.1": "EC Public Key",
    "1.2.840.10045.3.1.7": "P-256 (prime256v1)",
    "1.3.132.0.34": "P-384 (secp384r1)",
    "1.3.132.0.35": "P-521 (secp521r1)",
    "1.2.840.113549.1.9.14": "Extension Request",
    "2.5.29.17": "Subject Alternative Names",
  };
  return names[oid] || oid;
}

export const csrDecoder = defineTool({
  meta: {
    id: "crypto/csr-decoder",
    name: "CSR Decoder",
    description:
      "Free online CSR decoder — decode Certificate Signing Requests in PEM format instantly in your browser. No data is stored. Displays subject fields, algorithms, and OIDs from PKCS#10 CSR data.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: [
      "csr",
      "certificate",
      "signing",
      "request",
      "decode",
      "x509",
      "crypto",
    ],
    icon: "FileKey",
    examples: [
      {
        title: "Decode CSR",
        description: "Decode a PEM-encoded Certificate Signing Request",
        input:
          "-----BEGIN CERTIFICATE REQUEST-----\nMIIBhTCB7wIBAD... (paste full PEM)\n-----END CERTIFICATE REQUEST-----",
        output:
          "(Decoded CSR details — paste a full PEM-encoded CSR to see subject, key algorithm, and signature info)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const trimmed = input.input.trim();

    // Extract base64 from PEM
    const pemMatch = trimmed.match(
      /-----BEGIN (?:NEW )?CERTIFICATE REQUEST-----\s*([\s\S]*?)\s*-----END (?:NEW )?CERTIFICATE REQUEST-----/
    );
    if (!pemMatch) {
      throw new Error(
        "Invalid CSR format. Must be PEM-encoded with BEGIN/END CERTIFICATE REQUEST markers."
      );
    }

    const b64 = pemMatch[1]!.replace(/\s/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const lines: string[] = ["=== Certificate Signing Request ==="];
    lines.push(`Total size: ${bytes.length} bytes`);

    // Parse top-level SEQUENCE
    try {
      const outer = parseAsn1(bytes, 0);
      if (outer.tag !== 0x30) {
        throw new Error("Expected SEQUENCE at top level");
      }

      // Parse CertificationRequestInfo
      const reqInfo = parseAsn1(outer.value, 0);

      // Try to extract subject information
      // Walk through the structure to find UTF8Strings and PrintableStrings
      const decoder = new TextDecoder();
      const strings: string[] = [];
      const oids: string[] = [];

      const walk = function (data: Uint8Array, depth: number): void {
        let pos = 0;
        while (pos < data.length) {
          try {
            const item = parseAsn1(data, pos);
            if (item.tag === 0x06) {
              // OID
              oids.push(readOid(item.value));
            } else if (
              item.tag === 0x0c ||
              item.tag === 0x13 ||
              item.tag === 0x16
            ) {
              // UTF8String, PrintableString, or IA5String
              const lastOid = oids[oids.length - 1];
              const oidName = lastOid ? oidToName(lastOid) : "Unknown";
              strings.push(`  ${oidName}: ${decoder.decode(item.value)}`);
            } else if (
              item.tag === 0x30 ||
              item.tag === 0x31 ||
              (item.tag & 0xa0) === 0xa0
            ) {
              // SEQUENCE, SET, or context-specific: recurse
              walk(item.value, depth + 1);
            }
            pos = item.end;
          } catch {
            break;
          }
        }
      };

      walk(reqInfo.value, 0);

      if (strings.length > 0) {
        lines.push("");
        lines.push("Subject:");
        lines.push(...strings);
      }

      // List found OIDs
      const uniqueOids = [...new Set(oids)];
      if (uniqueOids.length > 0) {
        lines.push("");
        lines.push("Algorithms/OIDs found:");
        for (const oid of uniqueOids) {
          lines.push(`  ${oidToName(oid)} (${oid})`);
        }
      }
    } catch (e) {
      lines.push("");
      lines.push(
        `Note: Could not fully parse ASN.1 structure: ${(e as Error).message}`
      );
    }

    return { output: lines.join("\n") };
  },
});
