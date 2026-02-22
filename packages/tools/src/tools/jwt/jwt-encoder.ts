import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hmacSign(
  data: string,
  secret: string,
  algorithm: "HS256" | "HS384" | "HS512"
): Promise<string> {
  const algMap: Record<string, string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
  };
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: algMap[algorithm]! },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const bytes = new Uint8Array(sig);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const inputSchema = z.object({
  input: z.string().describe("JSON payload for the JWT claims"),
});

const optionsSchema = z.object({
  secret: z
    .string()
    .min(8, "Secret key must be at least 8 characters for security")
    .default("my-secret-key")
    .describe("Secret key for HMAC signing (minimum 8 characters)"),
  algorithm: z
    .enum(["HS256", "HS384", "HS512"])
    .default("HS256")
    .describe("HMAC signing algorithm"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoded JWT token"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

async function execute(input: Input, options?: Options): Promise<Output> {
  const payload = input.input.trim();
  if (!payload) {
    throw new Error("JWT payload cannot be empty");
  }

  let payloadObj: unknown;
  try {
    payloadObj = JSON.parse(payload);
  } catch {
    throw new Error("Invalid JSON payload");
  }

  if (
    typeof payloadObj !== "object" ||
    payloadObj === null ||
    Array.isArray(payloadObj)
  ) {
    throw new Error("JWT payload must be a JSON object");
  }

  const algorithm = options?.algorithm ?? "HS256";
  const secret = options?.secret ?? "my-secret-key";
  const header = { alg: algorithm, typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payloadObj));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(signingInput, secret, algorithm);

  return { output: `${signingInput}.${signature}` };
}

export const jwtEncoder = defineTool({
  meta: {
    id: "jwt/jwt-encoder",
    name: "JWT Encoder",
    description:
      "Free online JWT encoder — create HMAC-signed JWT tokens instantly in your browser. No data is stored. Supports HS256, HS384, and HS512 algorithms with configurable secret key.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "encode",
      "create",
      "sign",
      "token",
      "hmac",
      "hs256",
      "hs384",
      "hs512",
    ],
    examples: [
      {
        title: "Sign user claims with HS256",
        description:
          "Create an HMAC-signed JWT from a JSON claims payload (uses default secret and HS256)",
        input:
          '{"sub":"1234567890","name":"John Doe","role":"admin","iat":1516239022}',
        output:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.9AILqmNntS1nzSGb8Y_2HqmgQRoUhw5syBVsIoACMYE",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
