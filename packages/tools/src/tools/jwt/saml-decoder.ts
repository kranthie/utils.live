import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Base64-encoded SAML assertion or response"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded SAML XML"),
  isDeflated: z.boolean().describe("Whether the input appeared to be deflated"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let token = input.input.trim();
  if (!token) throw new Error("SAML assertion cannot be empty");

  // URL-decode if necessary
  if (token.includes("%")) {
    try {
      token = decodeURIComponent(token);
    } catch {
      // continue with original
    }
  }

  // Base64 decode
  let decoded: string;
  try {
    // Normalize base64 (might be URL-safe)
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    throw new Error("Failed to Base64 decode the SAML assertion");
  }

  // Check if it looks like XML
  const isXml = decoded.trim().startsWith("<");

  if (!isXml) {
    // Might be deflated - we can't easily inflate in pure JS without pako
    return {
      output:
        "The decoded content does not appear to be XML.\n" +
        "It may be DEFLATE-compressed (common in SAML HTTP-Redirect binding).\n" +
        "DEFLATE decompression is not available in this client-side tool.\n\n" +
        "Try using the HTTP-POST binding format (plain Base64, no DEFLATE).\n\n" +
        "Raw bytes (hex): " +
        Array.from(new TextEncoder().encode(decoded).slice(0, 64))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ") +
        "...",
      isDeflated: true,
    };
  }

  // Simple XML pretty-print
  let formatted = "";
  let indent = 0;
  const lines = decoded.replace(/>\s*</g, ">\n<").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }

    formatted += "  ".repeat(indent) + trimmed + "\n";

    if (
      trimmed.startsWith("<") &&
      !trimmed.startsWith("</") &&
      !trimmed.startsWith("<?") &&
      !trimmed.endsWith("/>") &&
      !trimmed.includes("</")
    ) {
      indent++;
    }
  }

  return {
    output: formatted.trim(),
    isDeflated: false,
  };
}

export const samlDecoder = defineTool({
  meta: {
    id: "jwt/saml-decoder",
    name: "SAML Decoder",
    description:
      "Free online SAML decoder — decode Base64-encoded SAML assertions and responses to readable XML instantly in your browser. No data is stored. Handles URL-encoded and base64url input, pretty-prints XML with proper indentation.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "saml",
      "decode",
      "assertion",
      "xml",
      "sso",
      "identity",
      "response",
      "base64",
      "idp",
      "sp",
    ],
    examples: [
      {
        title: "Decode SAML 2.0 Response with NameID assertion",
        description:
          "Decode a Base64-encoded SAML response containing a user identity assertion",
        input:
          "PHNhbWxwOlJlc3BvbnNlIHhtbG5zOnNhbWxwPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6cHJvdG9jb2wiIElEPSJfYWJjMTIzIj48c2FtbDpBc3NlcnRpb24geG1sbnM6c2FtbD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOmFzc2VydGlvbiI+PHNhbWw6U3ViamVjdD48c2FtbDpOYW1lSUQ+dXNlckBleGFtcGxlLmNvbTwvc2FtbDpOYW1lSUQ+PC9zYW1sOlN1YmplY3Q+PC9zYW1sOkFzc2VydGlvbj48L3NhbWxwOlJlc3BvbnNlPg==",
        output:
          '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_abc123">\n  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">\n    <saml:Subject>\n      <saml:NameID>user@example.com</saml:NameID>\n    </saml:Subject>\n  </saml:Assertion>\n</samlp:Response>',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
