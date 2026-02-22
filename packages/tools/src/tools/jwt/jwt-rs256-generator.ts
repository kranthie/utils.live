import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]!);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlEncodeStr(str: string): string {
  return base64UrlEncode(new TextEncoder().encode(str));
}

const inputSchema = z.object({
  payload: z
    .string()
    .default('{"sub":"1234567890","name":"John Doe","admin":true}')
    .describe("JSON payload for the JWT"),
  expiresInMinutes: z
    .number()
    .min(1)
    .max(525960)
    .default(60)
    .describe("Expiration in minutes from now"),
});

const outputSchema = z.object({
  token: z.string().describe("Generated RS256-signed JWT token"),
  publicKeyPem: z
    .string()
    .describe("Public key in PEM format (for verification)"),
  privateKeyPem: z.string().describe("Private key in PEM format (keep secret)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function toPem(keyData: ArrayBuffer, type: "PUBLIC" | "PRIVATE"): string {
  const b64 = arrayBufferToBase64(keyData);
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 64) {
    lines.push(b64.substring(i, i + 64));
  }
  return `-----BEGIN ${type} KEY-----\n${lines.join("\n")}\n-----END ${type} KEY-----`;
}

async function execute(input: Input): Promise<Output> {
  let payloadObj: Record<string, unknown>;
  try {
    payloadObj = JSON.parse(input.payload) as Record<string, unknown>;
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

  // Add expiry claims
  const now = Math.floor(Date.now() / 1000);
  payloadObj.iat = now;
  payloadObj.exp = now + input.expiresInMinutes * 60;

  // Generate RSA key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  // Export keys
  const publicKeyData = await crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const privateKeyData = await crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );

  // Create JWT
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64UrlEncodeStr(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeStr(JSON.stringify(payloadObj));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Sign
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(signingInput)
  );
  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));

  return {
    token: `${signingInput}.${signature}`,
    publicKeyPem: toPem(publicKeyData, "PUBLIC"),
    privateKeyPem: toPem(privateKeyData, "PRIVATE"),
  };
}

export const jwtRs256Generator = defineTool({
  meta: {
    id: "jwt/jwt-rs256-generator",
    name: "JWT RS256 Generator",
    description:
      "Free online JWT RS256 generator — create RS256-signed JWT tokens with auto-generated RSA key pairs instantly in your browser. No data is stored. Generates 2048-bit RSA keys, exports PEM public/private keys for verification.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "jwt",
      "rs256",
      "rsa",
      "generate",
      "sign",
      "asymmetric",
      "keypair",
      "pem",
      "pkcs8",
      "spki",
    ],
    examples: [
      {
        title: "Generate RS256 JWT with admin claims",
        description:
          "Create an RSA-signed JWT with auto-generated 2048-bit key pair, 1-hour expiry",
        input: {
          payload: '{"sub":"user-12345","name":"Jane Smith","role":"admin"}',
          expiresInMinutes: 60,
        },
        output:
          "(RS256-signed JWT token with RSA key pair — output varies due to key generation)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
