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
  input: z.string().describe("JWT token to debug"),
});

const outputSchema = z.object({
  output: z.string().describe("Debug report"),
  issues: z.array(z.string()).describe("List of issues found"),
  suggestions: z.array(z.string()).describe("Suggestions for fixing issues"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const token = input.input.trim();
  const issues: string[] = [];
  const suggestions: string[] = [];
  const lines: string[] = ["=== JWT Debug Report ===", ""];

  if (!token) {
    issues.push("Token is empty");
    suggestions.push("Provide a valid JWT token");
    return {
      output: "JWT Debug Report: Token is empty",
      issues,
      suggestions,
    };
  }

  // Check whitespace
  if (token !== input.input) {
    issues.push("Token has leading/trailing whitespace");
    suggestions.push("Trim whitespace from the token");
  }

  // Check basic structure
  const parts = token.split(".");
  lines.push(`Parts count: ${parts.length}`);

  if (parts.length !== 3) {
    issues.push(`Invalid structure: ${parts.length} parts (expected 3)`);
    suggestions.push("JWT must have exactly 3 parts: header.payload.signature");
    if (parts.length === 2) {
      suggestions.push(
        "Missing signature. Did you mean to use an unsecured JWT (alg: none)?"
      );
    }
    return {
      output: lines.join("\n") + "\n\nIssues:\n" + issues.join("\n"),
      issues,
      suggestions,
    };
  }

  // Debug header
  lines.push("\n--- Header ---");
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]!)) as Record<
      string,
      unknown
    >;
    lines.push(JSON.stringify(header, null, 2));

    const alg = header.alg as string | undefined;
    const typ = header.typ as string | undefined;

    if (!alg) {
      issues.push("Header missing 'alg' (algorithm) field");
      suggestions.push("Add 'alg' field to header (e.g., 'HS256', 'RS256')");
    } else {
      lines.push(`Algorithm: ${alg}`);
      const validAlgs = [
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
        "PS256",
        "PS384",
        "PS512",
        "none",
      ];
      if (!validAlgs.includes(alg)) {
        issues.push(`Unknown algorithm: ${alg}`);
        suggestions.push(`Use a standard algorithm: ${validAlgs.join(", ")}`);
      }
      if (alg === "none") {
        issues.push("Algorithm is 'none' - token is unsecured");
        suggestions.push("Use a proper signing algorithm for production");
      }
    }

    if (!typ) {
      issues.push("Header missing 'typ' field");
      suggestions.push("Add 'typ: \"JWT\"' to header");
    } else if (typ !== "JWT") {
      issues.push(`Unexpected typ: '${typ}' (expected 'JWT')`);
    }
  } catch {
    issues.push("Header is not valid base64url-encoded JSON");
    suggestions.push("Ensure header is properly base64url-encoded JSON object");
  }

  // Debug payload
  lines.push("\n--- Payload ---");
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]!)) as Record<
      string,
      unknown
    >;
    lines.push(JSON.stringify(payload, null, 2));

    // Check standard claims
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp) {
      const exp = Number(payload.exp);
      lines.push(`Expires: ${new Date(exp * 1000).toISOString()}`);
      if (now > exp) {
        const agoSec = now - exp;
        issues.push(`Token expired ${agoSec} seconds ago`);
        suggestions.push("Generate a new token with a future expiration");
      }
    } else {
      issues.push("No 'exp' (expiration) claim");
      suggestions.push("Add an 'exp' claim for security");
    }

    if (payload.iat) {
      const iat = Number(payload.iat);
      lines.push(`Issued at: ${new Date(iat * 1000).toISOString()}`);
      if (iat > now + 60) {
        issues.push("'iat' is in the future");
        suggestions.push("Check clock synchronization");
      }
    }

    if (payload.nbf) {
      const nbf = Number(payload.nbf);
      lines.push(`Not before: ${new Date(nbf * 1000).toISOString()}`);
      if (now < nbf) {
        issues.push("Token is not yet valid (nbf is in the future)");
        suggestions.push(
          `Token becomes valid at ${new Date(nbf * 1000).toISOString()}`
        );
      }
    }

    if (payload.iss)
      lines.push(
        `Issuer: ${typeof payload.iss === "object" ? JSON.stringify(payload.iss) : String(payload.iss as string | number)}`
      );
    if (payload.sub)
      lines.push(
        `Subject: ${typeof payload.sub === "object" ? JSON.stringify(payload.sub) : String(payload.sub as string | number)}`
      );
    if (payload.aud)
      lines.push(
        `Audience: ${typeof payload.aud === "object" ? JSON.stringify(payload.aud) : String(payload.aud as string | number)}`
      );
  } catch {
    issues.push("Payload is not valid base64url-encoded JSON");
    suggestions.push(
      "Ensure payload is properly base64url-encoded JSON object"
    );
  }

  // Debug signature
  lines.push("\n--- Signature ---");
  if (!parts[2] || parts[2].length === 0) {
    issues.push("Signature is empty");
    suggestions.push("Sign the token with a valid key");
  } else {
    lines.push(`Signature length: ${parts[2].length} characters`);
    lines.push(`Signature (base64url): ${parts[2]}`);
  }

  // Summary
  lines.push("\n--- Summary ---");
  lines.push(`Issues found: ${issues.length}`);
  if (issues.length === 0) {
    lines.push("No issues detected. Token structure appears valid.");
  }

  return {
    output: lines.join("\n"),
    issues,
    suggestions,
  };
}

export const jwtDebugger = defineTool({
  meta: {
    id: "jwt/jwt-debugger",
    name: "JWT Debugger",
    description:
      "Free online JWT debugger — analyze JWT tokens for expiry, format, and claims problems instantly in your browser. No data is stored. Detects expired tokens, missing claims, invalid algorithms, malformed headers, and structural issues.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "debug",
      "troubleshoot",
      "diagnose",
      "token",
      "expired",
      "algorithm",
      "signature",
      "hs256",
      "rs256",
    ],
    examples: [
      {
        title: "Analyze an expired JWT token",
        description: "Debug a JWT to find expiration issues and missing claims",
        input:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        output:
          '=== JWT Debug Report ===\n\nParts count: 3\n\n--- Header ---\n{\n  "alg": "HS256",\n  "typ": "JWT"\n}\nAlgorithm: HS256\n\n--- Payload ---\n{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "exp": 1516239022\n}\nExpires: 2018-01-18T01:30:22.000Z\nSubject: 1234567890\n\n--- Signature ---\nSignature length: 43 characters\nSignature (base64url): SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c\n\n--- Summary ---\nIssues found: 1',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
