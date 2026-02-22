import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { sha3Hash } from "../../../src/tools/crypto/sha3-hash";
import { blake2Hash } from "../../../src/tools/crypto/blake2-hash";
import { ripemd160Hash } from "../../../src/tools/crypto/ripemd160-hash";

describe("SHA-3 Hash", () => {
  it("should hash empty string with SHA3-256", async () => {
    const result = await executeTool(sha3Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      // SHA3-256 of empty string is known
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should produce 64-char hex for SHA3-256", async () => {
    const result = await executeTool(sha3Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should produce 128-char hex for SHA3-512", async () => {
    const result = await executeTool(
      sha3Hash,
      { input: "hello" },
      { variant: "sha3-512" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{128}$/
      );
    }
  });

  it("should produce different results for SHA3-256 vs SHA3-512", async () => {
    const r256 = await executeTool(
      sha3Hash,
      { input: "test" },
      { variant: "sha3-256" }
    );
    const r512 = await executeTool(
      sha3Hash,
      { input: "test" },
      { variant: "sha3-512" }
    );
    expect(r256.success && r512.success).toBe(true);
    if (r256.success && r512.success) {
      expect((r256.data as Record<string, unknown>).output).not.toBe(
        (r512.data as Record<string, unknown>).output
      );
      expect((r256.data as Record<string, unknown>).output.length).toBe(64);
      expect((r512.data as Record<string, unknown>).output.length).toBe(128);
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(sha3Hash, { input: "test data" });
    const r2 = await executeTool(sha3Hash, { input: "test data" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("BLAKE2b Hash", () => {
  it("should hash empty string with default digest length (32 bytes)", async () => {
    const result = await executeTool(blake2Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should hash 'hello'", async () => {
    const result = await executeTool(blake2Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should support custom digest length", async () => {
    const result = await executeTool(
      blake2Hash,
      { input: "test" },
      { digestLength: 16 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output.length).toBe(32); // 16 bytes = 32 hex chars
    }
  });

  it("should support full 64-byte digest", async () => {
    const result = await executeTool(
      blake2Hash,
      { input: "test" },
      { digestLength: 64 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output.length).toBe(128); // 64 bytes = 128 hex chars
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(blake2Hash, { input: "hello world" });
    const r2 = await executeTool(blake2Hash, { input: "hello world" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });

  it("should produce different hashes for different inputs", async () => {
    const r1 = await executeTool(blake2Hash, { input: "hello" });
    const r2 = await executeTool(blake2Hash, { input: "world" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});

describe("RIPEMD-160 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(ripemd160Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      // RIPEMD-160 of empty string is known: 9c1185a5c5e9fc54612808977ee8f548b2258d31
      expect((result.data as Record<string, unknown>).output).toBe(
        "9c1185a5c5e9fc54612808977ee8f548b2258d31"
      );
    }
  });

  it("should produce 40-char hex string", async () => {
    const result = await executeTool(ripemd160Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{40}$/
      );
    }
  });

  it("should hash 'abc'", async () => {
    const result = await executeTool(ripemd160Hash, { input: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      // RIPEMD-160 of "abc" is known: 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
      expect((result.data as Record<string, unknown>).output).toBe(
        "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"
      );
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(ripemd160Hash, { input: "test" });
    const r2 = await executeTool(ripemd160Hash, { input: "test" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });

  it("should produce different hashes for different inputs", async () => {
    const r1 = await executeTool(ripemd160Hash, { input: "hello" });
    const r2 = await executeTool(ripemd160Hash, { input: "world" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});
