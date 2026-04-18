import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { fernetEncoder } from "../../../src/tools/jwt/fernet-encoder";

describe("Fernet Encoder", () => {
  it("should generate a Fernet token with auto-generated key", async () => {
    const result = await executeTool(fernetEncoder, { payload: "Hello World" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).token).toBeDefined();
      expect((result.data as Record<string, unknown>).key).toBeDefined();
      expect((result.data as Record<string, unknown>).note).toContain("Fernet");
    }
  });

  it("should produce different tokens for same payload (random IV)", async () => {
    const r1 = await executeTool(fernetEncoder, { payload: "test" });
    const r2 = await executeTool(fernetEncoder, { payload: "test" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).token).not.toBe(
        (r2.data as Record<string, unknown>).token
      );
    }
  });

  it("should fail on empty payload", async () => {
    const result = await executeTool(fernetEncoder, { payload: "" });
    expect(result.success).toBe(false);
  });

  it("should produce a valid Fernet token structure", async () => {
    const result = await executeTool(fernetEncoder, { payload: "test data" });
    expect(result.success).toBe(true);
    if (result.success) {
      const token = String((result.data as Record<string, unknown>).token);
      // Decode url-safe base64 token (Fernet spec: + → -, / → _)
      const stdB64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(stdB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      // Version byte should be 0x80
      expect(bytes[0]).toBe(0x80);
      // Token should have: 1 (version) + 8 (timestamp) + 16 (IV) + ciphertext + 32 (HMAC)
      // Minimum ciphertext for "test data" (9 bytes) with PKCS7 padding = 16 bytes
      expect(bytes.length).toBeGreaterThanOrEqual(1 + 8 + 16 + 16 + 32);
    }
  });

  it("should use a provided key (accepts either url-safe or standard base64)", async () => {
    // Generate a 32-byte key in base64
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    let keyBinary = "";
    for (const b of keyBytes) {
      keyBinary += String.fromCharCode(b);
    }
    const keyBase64 = btoa(keyBinary);

    const result = await executeTool(fernetEncoder, {
      payload: "hello",
      key: keyBase64,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // The output key is emitted as url-safe base64 per Fernet spec.
      // Compare after normalizing to standard base64.
      const emittedKey = String((result.data as Record<string, unknown>).key);
      const emittedStd = emittedKey.replace(/-/g, "+").replace(/_/g, "/");
      expect(emittedStd).toBe(keyBase64);
    }
  });
});
