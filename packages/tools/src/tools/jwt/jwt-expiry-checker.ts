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
  input: z.string().describe("JWT token"),
});

const outputSchema = z.object({
  output: z.string().describe("Expiry status summary"),
  expired: z.boolean().describe("Whether the token is expired"),
  expiresAt: z.string().optional().describe("Expiration time as ISO string"),
  issuedAt: z.string().optional().describe("Issued at time as ISO string"),
  notBefore: z.string().optional().describe("Not before time as ISO string"),
  timeToExpiry: z
    .string()
    .optional()
    .describe("Human-readable time to/since expiry"),
  timeToExpiryMs: z
    .number()
    .optional()
    .describe("Milliseconds to/since expiry"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

  return parts.join(" ");
}

function execute(input: Input): Output {
  const token = input.input.trim();
  if (!token) throw new Error("JWT token cannot be empty");

  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid JWT: must have at least 2 parts");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]!)) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to decode JWT payload");
  }

  const now = Date.now();
  const lines: string[] = [];

  const expValue = typeof payload.exp === "number" ? payload.exp : undefined;
  const iatValue = typeof payload.iat === "number" ? payload.iat : undefined;
  const nbfValue = typeof payload.nbf === "number" ? payload.nbf : undefined;

  let expired = false;
  let expiresAt: string | undefined;
  let issuedAt: string | undefined;
  let notBefore: string | undefined;
  let timeToExpiry: string | undefined;
  let timeToExpiryMs: number | undefined;

  if (iatValue !== undefined) {
    issuedAt = new Date(iatValue * 1000).toISOString();
    lines.push(`Issued At: ${issuedAt}`);
  }

  if (nbfValue !== undefined) {
    notBefore = new Date(nbfValue * 1000).toISOString();
    lines.push(`Not Before: ${notBefore}`);
    if (now < nbfValue * 1000) {
      lines.push("  Status: Token is not yet valid");
    }
  }

  if (expValue !== undefined) {
    expiresAt = new Date(expValue * 1000).toISOString();
    timeToExpiryMs = expValue * 1000 - now;
    expired = timeToExpiryMs < 0;

    lines.push(`Expires At: ${expiresAt}`);
    if (expired) {
      timeToExpiry = `Expired ${formatDuration(-timeToExpiryMs)} ago`;
      lines.push(`  Status: EXPIRED (${timeToExpiry})`);
    } else {
      timeToExpiry = `Expires in ${formatDuration(timeToExpiryMs)}`;
      lines.push(`  Status: VALID (${timeToExpiry})`);
    }
  } else {
    lines.push("No expiration claim (exp) found in token");
    lines.push("Warning: Token never expires");
  }

  return {
    output: lines.join("\n"),
    expired,
    expiresAt,
    issuedAt,
    notBefore,
    timeToExpiry,
    timeToExpiryMs,
  };
}

export const jwtExpiryChecker = defineTool({
  meta: {
    id: "jwt/jwt-expiry-checker",
    name: "JWT Expiry Checker",
    description:
      "Free online JWT expiry checker — check JWT token expiration status instantly in your browser. No data is stored. Reads exp, iat, and nbf claims, shows remaining lifetime or time since expiry in human-readable format.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "expiry",
      "expiration",
      "check",
      "ttl",
      "token",
      "lifetime",
      "validate",
    ],
    examples: [
      {
        title: "Check expired JWT with iat and exp claims",
        description:
          "Inspect a JWT from January 2018 to see its expiry status and timestamps",
        input:
          "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTUxNjIzOTAyMiwiaWF0IjoxNTE2MjM4OTIyfQ.abc123",
        output:
          "Issued At: 2018-01-18T01:28:42.000Z\nExpires At: 2018-01-18T01:30:22.000Z\n  Status: EXPIRED (elapsed time varies)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
