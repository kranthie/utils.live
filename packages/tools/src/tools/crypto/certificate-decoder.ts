import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("PEM-encoded X.509 certificate"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded certificate information"),
});

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
    "2.5.4.3": "CN",
    "2.5.4.6": "C",
    "2.5.4.7": "L",
    "2.5.4.8": "ST",
    "2.5.4.10": "O",
    "2.5.4.11": "OU",
    "1.2.840.113549.1.1.1": "RSA",
    "1.2.840.113549.1.1.11": "SHA-256 with RSA",
    "1.2.840.113549.1.1.12": "SHA-384 with RSA",
    "1.2.840.113549.1.1.13": "SHA-512 with RSA",
    "1.2.840.10045.2.1": "EC",
    "1.2.840.10045.3.1.7": "P-256",
    "2.5.29.14": "Subject Key Identifier",
    "2.5.29.15": "Key Usage",
    "2.5.29.17": "Subject Alternative Names",
    "2.5.29.19": "Basic Constraints",
    "2.5.29.35": "Authority Key Identifier",
    "2.5.29.37": "Extended Key Usage",
  };
  return names[oid] || oid;
}

function parseUtcTime(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  const s = decoder.decode(bytes);
  // YYMMDDHHmmSSZ
  if (s.length >= 12) {
    let year = parseInt(s.substring(0, 2), 10);
    year = year >= 50 ? 1900 + year : 2000 + year;
    return `${year}-${s.substring(2, 4)}-${s.substring(4, 6)} ${s.substring(6, 8)}:${s.substring(8, 10)}:${s.substring(10, 12)} UTC`;
  }
  return s;
}

function parseGeneralizedTime(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  const s = decoder.decode(bytes);
  // YYYYMMDDHHmmSSZ
  if (s.length >= 14) {
    return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)} ${s.substring(8, 10)}:${s.substring(10, 12)}:${s.substring(12, 14)} UTC`;
  }
  return s;
}

export const certificateDecoder = defineTool({
  meta: {
    id: "crypto/certificate-decoder",
    name: "X.509 Certificate Decoder",
    description:
      "Free online X.509 certificate decoder — decode and display certificate details from PEM format instantly in your browser. No data is stored. Shows subject, issuer, validity dates, and signature algorithms.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: ["certificate", "x509", "ssl", "tls", "decode", "pem", "crypto"],
    icon: "FileKey",
    examples: [
      {
        title: "Decode Certificate",
        description:
          "Decode a PEM-encoded X.509 certificate to view its details",
        input:
          "-----BEGIN CERTIFICATE-----\nMIIBkTCB+wIJAL... (paste full PEM)\n-----END CERTIFICATE-----",
        output:
          "(Decoded certificate details — paste a full PEM certificate to see subject, issuer, validity, and extensions)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const trimmed = input.input.trim();

    const pemMatch = trimmed.match(
      /-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/
    );
    if (!pemMatch) {
      throw new Error(
        "Invalid certificate format. Must be PEM-encoded with BEGIN/END CERTIFICATE markers."
      );
    }

    const b64 = pemMatch[1]!.replace(/\s/g, "");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const lines: string[] = ["=== X.509 Certificate ==="];
    lines.push(`Total size: ${bytes.length} bytes`);

    try {
      const decoder = new TextDecoder();
      const subjectParts: string[] = [];
      const issuerParts: string[] = [];
      const dates: string[] = [];
      const algos: string[] = [];
      let isSubject = false;
      let isIssuer = false;
      let fieldCount = 0;

      const walk = function (data: Uint8Array, depth: number): void {
        let pos = 0;
        let lastOid = "";
        while (pos < data.length) {
          try {
            const item = parseAsn1(data, pos);

            if (item.tag === 0x06) {
              lastOid = readOid(item.value);
              algos.push(lastOid);
            } else if (item.tag === 0x17) {
              // UTCTime
              dates.push(parseUtcTime(item.value));
            } else if (item.tag === 0x18) {
              // GeneralizedTime
              dates.push(parseGeneralizedTime(item.value));
            } else if (
              item.tag === 0x0c ||
              item.tag === 0x13 ||
              item.tag === 0x16
            ) {
              const text = decoder.decode(item.value);
              const name = oidToName(lastOid);
              if (isIssuer) {
                issuerParts.push(`${name}=${text}`);
              } else if (isSubject) {
                subjectParts.push(`${name}=${text}`);
              }
            } else if (
              item.tag === 0x30 ||
              item.tag === 0x31 ||
              (item.tag & 0xa0) === 0xa0
            ) {
              // Track issuer vs subject based on order in TBSCertificate
              if (item.tag === 0x30 && depth === 1) {
                fieldCount++;
                if (fieldCount === 3) {
                  isIssuer = true;
                  isSubject = false;
                } else if (fieldCount === 5) {
                  isIssuer = false;
                  isSubject = true;
                } else {
                  isIssuer = false;
                  isSubject = false;
                }
              }
              walk(item.value, depth + 1);
            }
            pos = item.end;
          } catch {
            break;
          }
        }
      };

      // Parse outer SEQUENCE -> TBSCertificate
      const outer = parseAsn1(bytes, 0);
      const tbs = parseAsn1(outer.value, 0);
      walk(tbs.value, 0);

      if (issuerParts.length > 0) {
        lines.push("");
        lines.push(`Issuer: ${issuerParts.join(", ")}`);
      }

      if (subjectParts.length > 0) {
        lines.push(`Subject: ${subjectParts.join(", ")}`);
      }

      if (dates.length >= 2) {
        lines.push("");
        lines.push(`Not Before: ${dates[0]}`);
        lines.push(`Not After: ${dates[1]}`);
      }

      const uniqueAlgos = [...new Set(algos)];
      const namedAlgos = uniqueAlgos
        .map((a) => oidToName(a))
        .filter((n) => !n.includes("."));
      if (namedAlgos.length > 0) {
        lines.push("");
        lines.push(`Algorithms: ${namedAlgos.join(", ")}`);
      }
    } catch (e) {
      lines.push(`\nNote: Partial parse - ${(e as Error).message}`);
    }

    // Compute SHA-256 fingerprint
    lines.push("");
    lines.push(`SHA-256 Fingerprint: (use SHA-256 Hash tool on the DER bytes)`);

    return { output: lines.join("\n") };
  },
});
