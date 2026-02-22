import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  issuer: z.string().default("").describe("Issuer (iss) claim"),
  subject: z.string().default("").describe("Subject (sub) claim"),
  audience: z.string().default("").describe("Audience (aud) claim"),
  expiresInMinutes: z
    .number()
    .min(1)
    .max(525960)
    .default(60)
    .describe("Expiration in minutes from now"),
  includeIat: z
    .boolean()
    .default(true)
    .describe("Include issued-at (iat) claim"),
  includeJti: z.boolean().default(false).describe("Include JWT ID (jti) claim"),
  customClaims: z
    .string()
    .default("")
    .describe('Custom claims as JSON (e.g. {"role":"admin"})'),
});

const outputSchema = z.object({
  output: z.string().describe("JWT claims object as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = {};

  if (input.issuer) claims.iss = input.issuer;
  if (input.subject) claims.sub = input.subject;
  if (input.audience) claims.aud = input.audience;

  claims.exp = now + input.expiresInMinutes * 60;

  if (input.includeIat) {
    claims.iat = now;
  }

  if (input.includeJti) {
    // Generate a simple random ID
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    claims.jti = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  if (input.customClaims) {
    try {
      const custom = JSON.parse(input.customClaims) as Record<string, unknown>;
      if (
        typeof custom === "object" &&
        custom !== null &&
        !Array.isArray(custom)
      ) {
        Object.assign(claims, custom);
      }
    } catch {
      // Ignore invalid custom claims JSON
    }
  }

  return { output: JSON.stringify(claims, null, 2) };
}

export const jwtClaimsBuilder = defineTool({
  meta: {
    id: "jwt/jwt-claims-builder",
    name: "JWT Claims Builder",
    description:
      "Free online JWT claims builder — assemble JWT payload objects with standard RFC 7519 claims instantly in your browser. No data is stored. Supports iss, sub, aud, exp, iat, jti claims plus custom key-value pairs.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "claims",
      "builder",
      "generator",
      "payload",
      "iss",
      "sub",
      "aud",
      "exp",
      "iat",
      "jti",
      "rfc7519",
    ],
    examples: [
      {
        title: "API service token with RBAC claims",
        description:
          "Build claims for an API access token with role and permissions",
        input: {
          issuer: "https://auth.example.com",
          subject: "user-12345",
          audience: "https://api.example.com",
          expiresInMinutes: 30,
          includeIat: true,
          includeJti: false,
          customClaims: '{"role":"admin","permissions":["read","write"]}',
        },
        output:
          "(JSON claims object with iss, sub, aud, exp, iat, role, and permissions — exp/iat values vary based on current time)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
