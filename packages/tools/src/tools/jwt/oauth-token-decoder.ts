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

function tryBase64Decode(str: string): string | null {
  try {
    const bytes = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    // Check if result is mostly printable
    if (/^[\x20-\x7E\n\r\t]+$/.test(decoded)) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

const inputSchema = z.object({
  input: z.string().describe("OAuth token to decode"),
});

const outputSchema = z.object({
  output: z.string().describe("Decoded token information"),
  type: z.string().describe("Detected token type"),
  decoded: z.string().optional().describe("Decoded content if decodable"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const token = input.input.trim();
  if (!token) throw new Error("Token cannot be empty");

  const lines: string[] = ["=== OAuth Token Analysis ===", ""];

  // Check if it's a JWT (3 dot-separated parts)
  const jwtParts = token.split(".");
  if (jwtParts.length === 3) {
    lines.push("Type: JWT (JSON Web Token)");
    lines.push("");

    try {
      const header = JSON.parse(base64UrlDecode(jwtParts[0]!)) as Record<
        string,
        unknown
      >;
      lines.push("Header:");
      lines.push(JSON.stringify(header, null, 2));
    } catch {
      lines.push("Header: (failed to decode)");
    }

    lines.push("");
    try {
      const payload = JSON.parse(base64UrlDecode(jwtParts[1]!)) as Record<
        string,
        unknown
      >;
      lines.push("Payload:");
      lines.push(JSON.stringify(payload, null, 2));

      // Extract OAuth-relevant claims
      if (payload.scope as string)
        lines.push(`\nScope: ${payload.scope as string}`);
      if (payload.client_id as string)
        lines.push(`Client ID: ${payload.client_id as string}`);
      if (payload.aud as string)
        lines.push(`Audience: ${payload.aud as string}`);
      if (payload.exp as number) {
        lines.push(
          `Expires: ${new Date((payload.exp as number) * 1000).toISOString()}`
        );
      }
    } catch {
      lines.push("Payload: (failed to decode)");
    }

    return {
      output: lines.join("\n"),
      type: "JWT",
      decoded: lines.join("\n"),
    };
  }

  // Try standard Base64 decode
  const base64Decoded = tryBase64Decode(token);
  if (base64Decoded) {
    lines.push("Type: Base64-encoded token");
    lines.push("");
    lines.push("Decoded content:");
    lines.push(base64Decoded);

    // Try parsing as JSON
    try {
      const json = JSON.parse(base64Decoded) as Record<string, unknown>;
      lines.push("\nParsed JSON:");
      lines.push(JSON.stringify(json, null, 2));
    } catch {
      // Not JSON, just show the raw decoded text
    }

    return {
      output: lines.join("\n"),
      type: "Base64",
      decoded: base64Decoded,
    };
  }

  // Opaque token analysis
  lines.push("Type: Opaque token");
  lines.push(`Length: ${token.length} characters`);
  lines.push("");
  lines.push(
    "This appears to be an opaque token that cannot be decoded client-side."
  );
  lines.push(
    "Opaque tokens require server-side introspection (RFC 7662) to inspect."
  );

  // Heuristic analysis
  if (/^[a-zA-Z0-9_-]+$/.test(token)) {
    lines.push("Character set: URL-safe alphanumeric");
  } else if (/^[a-f0-9]+$/i.test(token)) {
    lines.push("Character set: Hexadecimal");
  }

  return {
    output: lines.join("\n"),
    type: "Opaque",
  };
}

export const oauthTokenDecoder = defineTool({
  meta: {
    id: "jwt/oauth-token-decoder",
    name: "OAuth Token Decoder",
    description:
      "Free online OAuth token decoder — decode and inspect OAuth access/refresh tokens instantly in your browser. No data is stored. Detects JWT vs opaque tokens, extracts scopes, client ID, audience, and expiration claims.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "oauth",
      "token",
      "decode",
      "access",
      "refresh",
      "bearer",
      "introspection",
      "rfc7662",
      "scope",
    ],
    examples: [
      {
        title: "Inspect OAuth 2.0 JWT access token",
        description:
          "Decode an RS256-signed OAuth access token to see scopes, client ID, and expiry",
        input:
          "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInNjb3BlIjoicmVhZCB3cml0ZSIsImNsaWVudF9pZCI6Im15LWFwcCIsImV4cCI6MTcwMDAwMDAwMH0.fake-signature",
        output:
          '=== OAuth Token Analysis ===\n\nType: JWT (JSON Web Token)\n\nHeader:\n{\n  "alg": "RS256",\n  "typ": "JWT"\n}\n\nPayload:\n{\n  "sub": "user-123",\n  "scope": "read write",\n  "client_id": "my-app",\n  "exp": 1700000000\n}\n\nScope: read write\nClient ID: my-app\nExpires: 2023-11-14T22:13:20.000Z',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
