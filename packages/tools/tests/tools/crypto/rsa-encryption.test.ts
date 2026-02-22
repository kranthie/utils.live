import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { rsaEncrypt } from "../../../src/tools/crypto/rsa-encrypt";
import { rsaDecrypt } from "../../../src/tools/crypto/rsa-decrypt";

/**
 * Helper: generate an RSA-OAEP keypair via Web Crypto and return JWK strings.
 */
async function generateRsaKeyPair(): Promise<{
  publicKeyJwk: string;
  privateKeyJwk: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyJwk = JSON.stringify(
    await crypto.subtle.exportKey("jwk", keyPair.publicKey)
  );
  const privateKeyJwk = JSON.stringify(
    await crypto.subtle.exportKey("jwk", keyPair.privateKey)
  );

  return { publicKeyJwk, privateKeyJwk };
}

describe("RSA-OAEP Encrypt/Decrypt", () => {
  it("should encrypt and decrypt round-trip", async () => {
    const { publicKeyJwk, privateKeyJwk } = await generateRsaKeyPair();

    const encResult = await executeTool(rsaEncrypt, {
      input: "Hello RSA!",
      publicKey: publicKeyJwk,
    });
    expect(encResult.success).toBe(true);

    if (encResult.success) {
      const decResult = await executeTool(rsaDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        privateKey: privateKeyJwk,
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe(
          "Hello RSA!"
        );
      }
    }
  });

  it("should produce base64 ciphertext", async () => {
    const { publicKeyJwk } = await generateRsaKeyPair();

    const result = await executeTool(rsaEncrypt, {
      input: "test",
      publicKey: publicKeyJwk,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9+/]+=*$/
      );
    }
  });

  it("should produce different ciphertext each encryption (OAEP randomness)", async () => {
    const { publicKeyJwk } = await generateRsaKeyPair();

    const r1 = await executeTool(rsaEncrypt, {
      input: "test",
      publicKey: publicKeyJwk,
    });
    const r2 = await executeTool(rsaEncrypt, {
      input: "test",
      publicKey: publicKeyJwk,
    });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should fail decryption with wrong key", async () => {
    const keys1 = await generateRsaKeyPair();
    const keys2 = await generateRsaKeyPair();

    const encResult = await executeTool(rsaEncrypt, {
      input: "secret data",
      publicKey: keys1.publicKeyJwk,
    });
    expect(encResult.success).toBe(true);

    if (encResult.success) {
      const decResult = await executeTool(rsaDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        privateKey: keys2.privateKeyJwk,
      });
      expect(decResult.success).toBe(false);
    }
  });

  it("should fail on invalid JWK format", async () => {
    const result = await executeTool(rsaEncrypt, {
      input: "test",
      publicKey: "not valid json",
    });
    expect(result.success).toBe(false);
  });

  it("should handle empty string encryption", async () => {
    const { publicKeyJwk, privateKeyJwk } = await generateRsaKeyPair();

    const encResult = await executeTool(rsaEncrypt, {
      input: "",
      publicKey: publicKeyJwk,
    });
    expect(encResult.success).toBe(true);

    if (encResult.success) {
      const decResult = await executeTool(rsaDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        privateKey: privateKeyJwk,
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe("");
      }
    }
  });
});
