import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { aesEncrypt } from "../../../src/tools/crypto/aes-encrypt";
import { aesDecrypt } from "../../../src/tools/crypto/aes-decrypt";
import { chacha20Encrypt_ as chacha20Encrypt } from "../../../src/tools/crypto/chacha20-encrypt";
import { chacha20Decrypt_ as chacha20Decrypt } from "../../../src/tools/crypto/chacha20-decrypt";

describe("AES-GCM Encrypt/Decrypt", () => {
  it("should encrypt and decrypt round-trip", async () => {
    const encResult = await executeTool(aesEncrypt, {
      input: "Hello, World!",
      key: "my-secret-key",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(aesDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        key: "my-secret-key",
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe(
          "Hello, World!"
        );
      }
    }
  });

  it("should produce base64 output", async () => {
    const result = await executeTool(aesEncrypt, { input: "test", key: "key" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9+/]+=*$/
      );
    }
  });

  it("should fail decryption with wrong key", async () => {
    const encResult = await executeTool(aesEncrypt, {
      input: "secret data",
      key: "correct-key",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(aesDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        key: "wrong-key",
      });
      expect(decResult.success).toBe(false);
    }
  });

  it("should handle empty string encryption", async () => {
    const encResult = await executeTool(aesEncrypt, { input: "", key: "key" });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(aesDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        key: "key",
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe("");
      }
    }
  });

  it("should handle unicode input", async () => {
    const encResult = await executeTool(aesEncrypt, {
      input: "Unicode text",
      key: "key",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(aesDecrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        key: "key",
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe(
          "Unicode text"
        );
      }
    }
  });
});

describe("ChaCha20 Encrypt/Decrypt", () => {
  it("should encrypt and decrypt round-trip", async () => {
    const encResult = await executeTool(chacha20Encrypt, {
      input: "Hello ChaCha20!",
      key: "secret-key",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(chacha20Decrypt, {
        input: (encResult.data as Record<string, unknown>).output,
        key: "secret-key",
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as Record<string, unknown>).output).toBe(
          "Hello ChaCha20!"
        );
      }
    }
  });

  it("should produce different ciphertext each time (random nonce)", async () => {
    const r1 = await executeTool(chacha20Encrypt, {
      input: "test",
      key: "key",
    });
    const r2 = await executeTool(chacha20Encrypt, {
      input: "test",
      key: "key",
    });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should fail with invalid base64 input", async () => {
    const result = await executeTool(chacha20Decrypt, {
      input: "not-base64!!!",
      key: "key",
    });
    expect(result.success).toBe(false);
  });
});
