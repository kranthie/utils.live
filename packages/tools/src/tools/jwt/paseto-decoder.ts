import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

const inputSchema = z.object({
  input: z.string().describe("PASETO token to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded PASETO information"),
  version: z.string().describe("PASETO version"),
  purpose: z.string().describe("PASETO purpose (local or public)"),
  payload: z.string().describe("Encoded payload (base64url)"),
  footer: z.string().optional().describe("Decoded footer if present"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const token = input.input.trim();
  if (!token) throw new Error("PASETO token cannot be empty");

  const parts = token.split(".");
  if (parts.length < 3 || parts.length > 4) {
    throw new Error(
      `Invalid PASETO format: expected 3-4 parts (version.purpose.payload[.footer]), got ${parts.length}`
    );
  }

  const version = parts[0]!;
  const purpose = parts[1]!;
  const payload = parts[2]!;
  const footerEncoded = parts[3];

  const validVersions = ["v1", "v2", "v3", "v4"];
  const validPurposes = ["local", "public"];

  if (!validVersions.includes(version)) {
    throw new Error(
      `Invalid PASETO version: ${version}. Expected: ${validVersions.join(", ")}`
    );
  }
  if (!validPurposes.includes(purpose)) {
    throw new Error(
      `Invalid PASETO purpose: ${purpose}. Expected: ${validPurposes.join(", ")}`
    );
  }

  let footer: string | undefined;
  if (footerEncoded) {
    try {
      const footerBytes = base64UrlDecode(footerEncoded);
      footer = new TextDecoder().decode(footerBytes);
    } catch {
      footer = "(failed to decode footer)";
    }
  }

  const lines: string[] = [];
  lines.push(`PASETO Token Analysis`);
  lines.push(`Version: ${version}`);
  lines.push(`Purpose: ${purpose}`);
  lines.push(`Payload (encoded): ${payload.substring(0, 50)}...`);
  if (footer) {
    lines.push(`Footer: ${footer}`);
  }
  lines.push("");
  lines.push(
    purpose === "local"
      ? "Note: Local tokens are encrypted. The payload cannot be decoded without the symmetric key."
      : "Note: Public tokens are signed but not encrypted. Verification requires the public key."
  );

  return {
    output: lines.join("\n"),
    version,
    purpose,
    payload,
    footer,
  };
}

export const pasetoDecoder = defineTool({
  meta: {
    id: "jwt/paseto-decoder",
    name: "PASETO Decoder",
    description:
      "Free online PASETO decoder — decode and inspect PASETO token structure instantly in your browser. No data is stored. Parses version (v1-v4), purpose (local/public), encoded payload, and optional footer with key ID.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "paseto",
      "decode",
      "token",
      "inspect",
      "v4",
      "public",
      "local",
      "alternative",
    ],
    examples: [
      {
        title: "Inspect v4.public token with key ID footer",
        description:
          "Decode a PASETO v4 public token to see its version, purpose, and footer metadata",
        input:
          "v4.public.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6IjIwMjUtMDEtMDFUMDA6MDA6MDBaIn0.eyJraWQiOiJrZXktMDAxIn0",
        output:
          'PASETO Token Analysis\nVersion: v4\nPurpose: public\nPayload (encoded): eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6IjIwMjUtMD...\nFooter: {"kid":"key-001"}\n\nNote: Public tokens are signed but not encrypted. Verification requires the public key.',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
