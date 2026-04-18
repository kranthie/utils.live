import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_");
}

const inputSchema = z.object({
  payload: z.string().default("").describe("Plaintext to encrypt"),
  key: z
    .string()
    .default("")
    .describe(
      "Base64-encoded 32-byte Fernet key (leave empty to auto-generate)"
    ),
});

const outputSchema = z.object({
  token: z.string().describe("Base64-encoded Fernet token"),
  key: z.string().describe("Base64-encoded Fernet key used for encryption"),
  note: z.string().describe("Implementation note"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

async function execute(input: Input): Promise<Output> {
  if (!input.payload) throw new Error("Payload cannot be empty");

  // Generate or use provided key (32 bytes = 16 signing + 16 encryption)
  let keyBytes: Uint8Array;
  if (input.key) {
    try {
      keyBytes = Uint8Array.from(atob(input.key), (c) => c.charCodeAt(0));
      if (keyBytes.length !== 32) {
        throw new Error("Fernet key must be exactly 32 bytes (Base64 encoded)");
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("32 bytes")) throw e;
      throw new Error("Invalid Base64 key format");
    }
  } else {
    keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
  }

  const signingKey = keyBytes.slice(0, 16);
  const encryptionKey = keyBytes.slice(16, 32);

  // Fernet token structure:
  // Version (1 byte: 0x80) | Timestamp (8 bytes, big-endian) | IV (16 bytes) | Ciphertext | HMAC (32 bytes)

  const version = new Uint8Array([0x80]);
  const timestamp = new Uint8Array(8);
  // Proper big-endian 64-bit timestamp encoding using BigInt
  let ts = BigInt(Math.floor(Date.now() / 1000));
  for (let i = 7; i >= 0; i--) {
    timestamp[i] = Number(ts & 0xffn);
    ts >>= 8n;
  }

  const iv = new Uint8Array(16);
  crypto.getRandomValues(iv);

  // AES-CBC encrypt (Web Crypto API applies PKCS7 padding automatically)
  const plaintextBytes = new TextEncoder().encode(input.payload);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    encryptionKey,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    aesKey,
    plaintextBytes
  );
  const ciphertext = new Uint8Array(cipherBuffer);

  // HMAC-SHA256
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    signingKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hmacData = new Uint8Array(
    version.length + timestamp.length + iv.length + ciphertext.length
  );
  let offset = 0;
  hmacData.set(version, offset);
  offset += version.length;
  hmacData.set(timestamp, offset);
  offset += timestamp.length;
  hmacData.set(iv, offset);
  offset += iv.length;
  hmacData.set(ciphertext, offset);

  const hmacBuffer = await crypto.subtle.sign("HMAC", hmacKey, hmacData);
  const hmac = new Uint8Array(hmacBuffer);

  // Concatenate all parts
  const tokenBytes = new Uint8Array(hmacData.length + hmac.length);
  tokenBytes.set(hmacData);
  tokenBytes.set(hmac, hmacData.length);

  return {
    token: base64UrlEncode(tokenBytes),
    key: base64UrlEncode(keyBytes),
    note: "Fernet token generated with AES-128-CBC encryption and HMAC-SHA256 authentication.",
  };
}

export const fernetEncoder = defineTool({
  meta: {
    id: "jwt/fernet-encoder",
    name: "Fernet Encoder",
    description:
      "Free online Fernet encoder — generate Fernet encrypted tokens instantly in your browser. No data is stored. Uses AES-128-CBC encryption with HMAC-SHA256 authentication, auto-generates or accepts a 32-byte symmetric key.",
    category: "jwt",
    tier: ToolTier.CLIENT,
    keywords: [
      "fernet",
      "encrypt",
      "token",
      "symmetric",
      "aes",
      "python",
      "cryptography",
      "aes-cbc",
      "hmac",
    ],
    examples: [
      {
        title: "Encrypt API credentials for config",
        description:
          "Generate a Fernet token encrypting sensitive data with an auto-generated key",
        input: {
          payload: "db_password=Kx9!mP2$vL&7qR",
        },
        output:
          "(Base64-encoded Fernet token — output varies due to random key and IV)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
