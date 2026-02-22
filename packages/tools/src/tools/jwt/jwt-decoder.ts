import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const inputSchema = z.object({
  input: z.string().describe("JWT token to decode"),
});

const outputSchema = z.object({
  header: z.string().describe("Decoded header as JSON string"),
  payload: z.string().describe("Decoded payload as JSON string"),
  signature: z.string().describe("Raw signature (base64url)"),
  output: z.string().describe("Full decoded JWT as formatted JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const token = input.input.trim();
  if (!token) {
    throw new Error("JWT token cannot be empty");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid JWT format: expected 3 parts separated by dots, got ${parts.length}`
    );
  }

  let header: unknown;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]!));
  } catch {
    throw new Error("Failed to decode JWT header: invalid base64url or JSON");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]!));
  } catch {
    throw new Error("Failed to decode JWT payload: invalid base64url or JSON");
  }

  const headerStr = JSON.stringify(header, null, 2);
  const payloadStr = JSON.stringify(payload, null, 2);
  const signature = parts[2]!;

  const full = JSON.stringify({ header, payload, signature }, null, 2);

  return {
    header: headerStr,
    payload: payloadStr,
    signature,
    output: full,
  };
}

export const jwtDecoder = defineTool({
  meta: {
    id: "jwt/jwt-decoder",
    name: "JWT Decoder",
    description:
      "Free online JWT decoder — decode JWT tokens into header, payload, and signature instantly in your browser. No data is stored. Parses base64url-encoded header and payload claims, displays the raw signature.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "decode",
      "token",
      "json",
      "web",
      "base64url",
      "header",
      "payload",
      "claims",
    ],
    examples: [
      {
        title: "Decode HS256 JWT with user claims",
        description:
          "Decode a JWT signed with HS256 to inspect its header, payload, and signature",
        input:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        output:
          '{\n  "header": {\n    "alg": "HS256",\n    "typ": "JWT"\n  },\n  "payload": {\n    "sub": "1234567890",\n    "name": "John Doe",\n    "iat": 1516239022\n  },\n  "signature": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
