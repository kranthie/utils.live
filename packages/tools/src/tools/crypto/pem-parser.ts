import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("PEM-encoded data to parse"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed PEM information"),
});

function parsePem(pem: string): string {
  const trimmed = pem.trim();

  const pemRegex =
    /-----BEGIN ([A-Z0-9 ]+)-----\s*([\s\S]*?)\s*-----END ([A-Z0-9 ]+)-----/g;
  const blocks: Array<{ label: string; base64: string }> = [];

  let match;
  while ((match = pemRegex.exec(trimmed)) !== null) {
    const beginLabel = match[1]!;
    const body = match[2]!;
    const endLabel = match[3]!;
    if (beginLabel !== endLabel) {
      throw new Error(
        `PEM label mismatch: BEGIN ${beginLabel} / END ${endLabel}`
      );
    }
    blocks.push({
      label: beginLabel,
      base64: body.replace(/\s/g, ""),
    });
  }

  if (blocks.length === 0) {
    throw new Error(
      "No valid PEM blocks found. PEM data must have BEGIN/END markers."
    );
  }

  const results: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const binary = atob(block.base64);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) {
      bytes[j] = binary.charCodeAt(j);
    }

    results.push(`=== PEM Block ${i + 1} ===`);
    results.push(`Type: ${block.label}`);
    results.push(`Size: ${bytes.length} bytes (${bytes.length * 8} bits)`);
    results.push(`Base64 length: ${block.base64.length} characters`);

    // Identify the type
    switch (block.label) {
      case "PUBLIC KEY":
        results.push("Format: SPKI (Subject Public Key Info)");
        break;
      case "PRIVATE KEY":
        results.push("Format: PKCS#8");
        break;
      case "RSA PRIVATE KEY":
        results.push("Format: PKCS#1 (RSA)");
        break;
      case "RSA PUBLIC KEY":
        results.push("Format: PKCS#1 Public Key");
        break;
      case "EC PRIVATE KEY":
        results.push("Format: SEC1 (EC)");
        break;
      case "CERTIFICATE":
        results.push("Format: X.509 Certificate (DER)");
        break;
      case "CERTIFICATE REQUEST":
        results.push("Format: PKCS#10 (CSR)");
        break;
      case "OPENSSH PRIVATE KEY":
        results.push("Format: OpenSSH Private Key");
        break;
      case "ENCRYPTED PRIVATE KEY":
        results.push("Format: PKCS#8 Encrypted");
        break;
      default:
        results.push(`Format: ${block.label}`);
    }

    // Show first few bytes as hex
    const hexPreview = Array.from(bytes.slice(0, 32))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    results.push(
      `First bytes: ${hexPreview}${bytes.length > 32 ? " ..." : ""}`
    );
    results.push("");
  }

  return results.join("\n").trim();
}

export const pemParser = defineTool({
  meta: {
    id: "crypto/pem-parser",
    name: "PEM Parser",
    description:
      "Free online PEM parser — parse and analyze PEM-encoded data instantly in your browser. No data is stored. Identifies key types (RSA, EC, X.509), formats (PKCS#1, PKCS#8, SPKI), and displays size and hex preview.",
    category: "crypto",
    subgroup: "Keys & Certificates",
    tier: ToolTier.CLIENT,
    keywords: ["pem", "parse", "certificate", "key", "x509", "crypto"],
    icon: "FileKey",
    examples: [
      {
        title: "Parse PEM Block",
        description:
          "Analyze a PEM-encoded public key to identify its type and size",
        input:
          "-----BEGIN PUBLIC KEY-----\nMIIBIjANBg... (paste full PEM)\n-----END PUBLIC KEY-----",
        output:
          "(Parsed PEM block details — paste a full PEM-encoded key, certificate, or CSR to see label, size, and base64 content)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    return { output: parsePem(input.input) };
  },
});
