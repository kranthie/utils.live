import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { md5Hash } from "../../../src/tools/crypto/md5-hash";
import { sha1Hash } from "../../../src/tools/crypto/sha1-hash";
import { sha256Hash } from "../../../src/tools/crypto/sha256-hash";
import { sha384Hash } from "../../../src/tools/crypto/sha384-hash";
import { sha512Hash } from "../../../src/tools/crypto/sha512-hash";
import { crc32Checksum } from "../../../src/tools/crypto/crc32-checksum";
import { adler32Checksum } from "../../../src/tools/crypto/adler32-checksum";
import { xxhash } from "../../../src/tools/crypto/xxhash";
import { murmurhash } from "../../../src/tools/crypto/murmurhash";
import { hashIdentifier } from "../../../src/tools/crypto/hash-identifier";
import { multiHash } from "../../../src/tools/crypto/multi-hash";

describe("MD5 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(md5Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "d41d8cd98f00b204e9800998ecf8427e"
      );
    }
  });

  it("should hash 'hello'", async () => {
    const result = await executeTool(md5Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "5d41402abc4b2a76b9719d911017c592"
      );
    }
  });

  it("should hash 'The quick brown fox jumps over the lazy dog'", async () => {
    const result = await executeTool(md5Hash, {
      input: "The quick brown fox jumps over the lazy dog",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "9e107d9d372bb6826bd81d3542a419d6"
      );
    }
  });

  it("should produce 32-char hex string", async () => {
    const result = await executeTool(md5Hash, { input: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{32}$/
      );
    }
  });
});

describe("SHA-1 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(sha1Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "da39a3ee5e6b4b0d3255bfef95601890afd80709"
      );
    }
  });

  it("should hash 'hello'", async () => {
    const result = await executeTool(sha1Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"
      );
    }
  });

  it("should produce 40-char hex string", async () => {
    const result = await executeTool(sha1Hash, { input: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{40}$/
      );
    }
  });
});

describe("SHA-256 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(sha256Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
    }
  });

  it("should hash 'hello'", async () => {
    const result = await executeTool(sha256Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
      );
    }
  });

  it("should produce 64-char hex string", async () => {
    const result = await executeTool(sha256Hash, { input: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });

  it("should handle UTF-8 input", async () => {
    const result = await executeTool(sha256Hash, { input: "Hello, World!" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{64}$/
      );
    }
  });
});

describe("SHA-384 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(sha384Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{96}$/
      );
    }
  });

  it("should produce 96-char hex string", async () => {
    const result = await executeTool(sha384Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{96}$/
      );
    }
  });
});

describe("SHA-512 Hash", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(sha512Hash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{128}$/
      );
    }
  });

  it("should hash 'hello'", async () => {
    const result = await executeTool(sha512Hash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{128}$/
      );
      expect((result.data as Record<string, unknown>).output).toBe(
        "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043"
      );
    }
  });

  it("should produce consistent results", async () => {
    const r1 = await executeTool(sha512Hash, { input: "test" });
    const r2 = await executeTool(sha512Hash, { input: "test" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("CRC32 Checksum", () => {
  it("should compute CRC32 of empty string", async () => {
    const result = await executeTool(crc32Checksum, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("00000000");
    }
  });

  it("should compute CRC32 of 'hello'", async () => {
    const result = await executeTool(crc32Checksum, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("3610a686");
    }
  });

  it("should produce 8-char hex string", async () => {
    const result = await executeTool(crc32Checksum, { input: "test data" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{8}$/
      );
    }
  });
});

describe("Adler-32 Checksum", () => {
  it("should compute Adler-32 of empty string", async () => {
    const result = await executeTool(adler32Checksum, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBe("00000001");
    }
  });

  it("should compute Adler-32 of 'hello'", async () => {
    const result = await executeTool(adler32Checksum, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{8}$/
      );
    }
  });

  it("should produce consistent results", async () => {
    const r1 = await executeTool(adler32Checksum, { input: "test" });
    const r2 = await executeTool(adler32Checksum, { input: "test" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("xxHash", () => {
  it("should hash empty string with seed 0", async () => {
    const result = await executeTool(xxhash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{8}$/
      );
    }
  });

  it("should produce different results with different seeds", async () => {
    const r1 = await executeTool(xxhash, { input: "hello" }, { seed: 0 });
    const r2 = await executeTool(xxhash, { input: "hello" }, { seed: 42 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should be deterministic", async () => {
    const r1 = await executeTool(xxhash, { input: "test" });
    const r2 = await executeTool(xxhash, { input: "test" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});

describe("MurmurHash3", () => {
  it("should hash empty string", async () => {
    const result = await executeTool(murmurhash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{8}$/
      );
    }
  });

  it("should produce 8-char hex", async () => {
    const result = await executeTool(murmurhash, { input: "hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[a-f0-9]{8}$/
      );
    }
  });

  it("should produce different results with different seeds", async () => {
    const r1 = await executeTool(murmurhash, { input: "hello" }, { seed: 0 });
    const r2 = await executeTool(murmurhash, { input: "hello" }, { seed: 1 });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});

describe("Hash Identifier", () => {
  it("should identify MD5", async () => {
    const result = await executeTool(hashIdentifier, {
      input: "d41d8cd98f00b204e9800998ecf8427e",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("MD5");
    }
  });

  it("should identify SHA-256", async () => {
    const result = await executeTool(hashIdentifier, {
      input: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256"
      );
    }
  });

  it("should identify bcrypt", async () => {
    const result = await executeTool(hashIdentifier, {
      input: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "bcrypt"
      );
    }
  });

  it("should handle unknown format", async () => {
    const result = await executeTool(hashIdentifier, { input: "not-a-hash" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Unable to identify"
      );
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(hashIdentifier, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("Multi Hash", () => {
  it("should generate multiple hashes", async () => {
    const result = await executeTool(multiHash, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-1:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-384:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-512:"
      );
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(multiHash, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      );
    }
  });

  it("should produce consistent results", async () => {
    const r1 = await executeTool(multiHash, { input: "test" });
    const r2 = await executeTool(multiHash, { input: "test" });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });
});
