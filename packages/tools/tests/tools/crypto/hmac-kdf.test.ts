import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { hmacSha256 } from "../../../src/tools/crypto/hmac-sha256";
import { hmacSha512 } from "../../../src/tools/crypto/hmac-sha512";
import { pbkdf2 } from "../../../src/tools/crypto/pbkdf2";
import { bcryptGenerator } from "../../../src/tools/crypto/bcrypt-generator";
import { bcryptVerifier } from "../../../src/tools/crypto/bcrypt-verifier";

describe("HMAC-SHA256", () => {
  it("should generate HMAC-SHA256", async () => {
    const result = await executeTool(hmacSha256, {
      input: "hello",
      key: "secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should produce different HMACs with different keys", async () => {
    const r1 = await executeTool(hmacSha256, { input: "hello", key: "key1" });
    const r2 = await executeTool(hmacSha256, { input: "hello", key: "key2" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should support base64 output", async () => {
    const result = await executeTool(
      hmacSha256,
      { input: "hello", key: "secret" },
      { outputFormat: "base64" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9+/]+=*$/
      );
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(hmacSha256, { input: "test", key: "key" });
    const r2 = await executeTool(hmacSha256, { input: "test", key: "key" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("HMAC-SHA512", () => {
  it("should generate HMAC-SHA512", async () => {
    const result = await executeTool(hmacSha512, {
      input: "hello",
      key: "secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{128}$/
      );
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(hmacSha512, { input: "test", key: "key" });
    const r2 = await executeTool(hmacSha512, { input: "test", key: "key" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });

  it("should produce different results from HMAC-SHA256", async () => {
    const r256 = await executeTool(hmacSha256, {
      input: "hello",
      key: "secret",
    });
    const r512 = await executeTool(hmacSha512, {
      input: "hello",
      key: "secret",
    });
    expect(r256.success && r512.success).toBe(true);
    if (r256.success && r512.success) {
      expect((r256.data as Record<string, unknown>).output).not.toBe(
        (r512.data as Record<string, unknown>).output
      );
    }
  });
});

describe("PBKDF2", () => {
  it("should derive key", async () => {
    const result = await executeTool(pbkdf2, {
      input: "password",
      salt: "salt",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]+$/
      );
    }
  });

  it("should produce different results with different salts", async () => {
    const r1 = await executeTool(pbkdf2, { input: "password", salt: "salt1" });
    const r2 = await executeTool(pbkdf2, { input: "password", salt: "salt2" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should respect key length option", async () => {
    const r128 = await executeTool(
      pbkdf2,
      { input: "password", salt: "salt" },
      { keyLength: 128 }
    );
    const r256 = await executeTool(
      pbkdf2,
      { input: "password", salt: "salt" },
      { keyLength: 256 }
    );
    expect(r128.success && r256.success).toBe(true);
    if (r128.success && r256.success) {
      expect((r128.data as Record<string, unknown>).output.length).toBe(32); // 128 bits = 16 bytes = 32 hex chars
      expect((r256.data as Record<string, unknown>).output.length).toBe(64); // 256 bits = 32 bytes = 64 hex chars
    }
  });

  it("should be deterministic with same params", async () => {
    const r1 = await executeTool(
      pbkdf2,
      { input: "password", salt: "salt" },
      { iterations: 1000 }
    );
    const r2 = await executeTool(
      pbkdf2,
      { input: "password", salt: "salt" },
      { iterations: 1000 }
    );
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("Bcrypt Generator", () => {
  it("should generate bcrypt hash", async () => {
    const result = await executeTool(
      bcryptGenerator,
      { input: "password" },
      { rounds: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^\$2b\$04\$.{53}$/
      );
    }
  });

  it("should generate different hashes each time (random salt)", async () => {
    const r1 = await executeTool(
      bcryptGenerator,
      { input: "password" },
      { rounds: 4 }
    );
    const r2 = await executeTool(
      bcryptGenerator,
      { input: "password" },
      { rounds: 4 }
    );
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should respect rounds option", async () => {
    const result = await executeTool(
      bcryptGenerator,
      { input: "test" },
      { rounds: 8 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "$2b$08$"
      );
    }
  });
});

describe("Bcrypt Verifier", () => {
  it("should verify matching password/hash pair", async () => {
    const genResult = await executeTool(
      bcryptGenerator,
      { input: "password123" },
      { rounds: 4 }
    );
    expect(genResult.success).toBe(true);
    if (genResult.success) {
      const verifyResult = await executeTool(bcryptVerifier, {
        input: "password123",
        hash: (genResult.data as Record<string, unknown>).output,
      });
      expect(verifyResult.success).toBe(true);
      if (verifyResult.success) {
        expect((verifyResult.data as Record<string, unknown>).output).toContain(
          "MATCH"
        );
      }
    }
  });

  it("should reject wrong password", async () => {
    const genResult = await executeTool(
      bcryptGenerator,
      { input: "correct" },
      { rounds: 4 }
    );
    expect(genResult.success).toBe(true);
    if (genResult.success) {
      const verifyResult = await executeTool(bcryptVerifier, {
        input: "wrong",
        hash: (genResult.data as Record<string, unknown>).output,
      });
      expect(verifyResult.success).toBe(true);
      if (verifyResult.success) {
        expect((verifyResult.data as Record<string, unknown>).output).toContain(
          "NO MATCH"
        );
      }
    }
  });

  it("should reject invalid hash format", async () => {
    const result = await executeTool(bcryptVerifier, {
      input: "test",
      hash: "invalid-hash",
    });
    expect(result.success).toBe(false);
  });
});
