import { describe, it, expect } from "vitest";
import { stringHash } from "../../../src/tools/crypto/string-hash";
import { executeTool } from "../../../src/core/executor";

describe("stringHash", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(stringHash.meta.id).toBe("crypto/string-hash");
      expect(stringHash.meta.category).toBe("crypto");
    });
  });

  describe("execute", () => {
    it("should produce DJB2, SDBM, and FNV-1a hashes", async () => {
      const result = await executeTool(stringHash, { input: "hello" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("DJB2:");
        expect(output).toContain("SDBM:");
        expect(output).toContain("FNV-1a:");
      }
    });

    it("should output both hex and decimal for each hash", async () => {
      const result = await executeTool(stringHash, { input: "hello" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        // Each line should have hex and decimal in parens: "DJB2:   abc123 (12345678)"
        const lines = output.split("\n");
        for (const line of lines) {
          expect(line).toMatch(/[0-9a-f]+ \(\d+\)/);
        }
      }
    });

    it("should match the documented example output for 'hello'", async () => {
      const result = await executeTool(stringHash, { input: "hello" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toBe(stringHash.meta.examples![0]!.output);
      }
    });

    it("should be deterministic — same input produces same output", async () => {
      const r1 = await executeTool(stringHash, { input: "test-string" });
      const r2 = await executeTool(stringHash, { input: "test-string" });
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      if (r1.success && r2.success) {
        expect((r1.data as Record<string, unknown>).output).toBe(
          (r2.data as Record<string, unknown>).output
        );
      }
    });

    it("should produce different outputs for different inputs", async () => {
      const r1 = await executeTool(stringHash, { input: "foo" });
      const r2 = await executeTool(stringHash, { input: "bar" });
      expect(r1.success).toBe(true);
      expect(r2.success).toBe(true);
      if (r1.success && r2.success) {
        expect((r1.data as Record<string, unknown>).output).not.toBe(
          (r2.data as Record<string, unknown>).output
        );
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(stringHash, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should handle single character input", async () => {
      const result = await executeTool(stringHash, { input: "a" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output.split("\n").length).toBe(3);
      }
    });
  });
});
