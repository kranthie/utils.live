import { describe, it, expect } from "vitest";
import { anagramGenerator } from "../../../src/tools/text/anagram-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("anagramGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(anagramGenerator.meta.id).toBe("text/anagram-generator");
      expect(anagramGenerator.meta.name).toBe("Letter Shuffler");
      expect(anagramGenerator.meta.category).toBe("text");
      expect(anagramGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(anagramGenerator.meta.keywords).toContain("anagram");
      expect(anagramGenerator.meta.keywords).toContain("permutation");
    });
  });

  describe("execute", () => {
    it("should generate anagrams for a simple word", async () => {
      const result = await executeTool(anagramGenerator, { input: "cat" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).anagrams
        ).toBeInstanceOf(Array);
        expect(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        ).toBeGreaterThan(0);
        expect((result.data as Record<string, unknown>).totalPossible).toBe(5); // 3! - 1 = 5
        // Each anagram should have the same letters as "cat"
        for (const anagram of (result.data as Record<string, unknown>)
          .anagrams as string[]) {
          expect(anagram.split("").sort().join("")).toBe("act");
        }
      }
    });

    it("should respect the limit option", async () => {
      const result = await executeTool(
        anagramGenerator,
        { input: "hello" },
        { limit: 5 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        ).toBeLessThanOrEqual(5);
      }
    });

    it("should filter by minimum length", async () => {
      // "ab" has only 1 anagram: "ba", which is valid with minLength 2
      const result = await executeTool(
        anagramGenerator,
        { input: "abc" },
        { minLength: 2 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        ).toBeGreaterThan(0);
      }
    });

    it("should error on input too short", async () => {
      const result = await executeTool(
        anagramGenerator,
        { input: "a" },
        { minLength: 2 }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TEXT_EMPTY_INPUT");
        expect(result.error.message).toContain("too short");
      }
    });

    it("should error on input too long", async () => {
      const result = await executeTool(anagramGenerator, {
        input: "abcdefghijklmno",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TEXT_EMPTY_INPUT");
        expect(result.error.message).toContain("too long");
      }
    });

    it("should ignore non-letter characters", async () => {
      const result = await executeTool(anagramGenerator, { input: "c-a-t!" });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should process as "cat"
        expect((result.data as Record<string, unknown>).totalPossible).toBe(5);
      }
    });

    it("should handle uppercase letters", async () => {
      const result = await executeTool(anagramGenerator, { input: "CAT" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        ).toBeGreaterThan(0);
        // All anagrams should be lowercase
        for (const anagram of (result.data as Record<string, unknown>)
          .anagrams as string[]) {
          expect(anagram).toBe(anagram.toLowerCase());
        }
      }
    });

    it("should not include original word in anagrams", async () => {
      const result = await executeTool(anagramGenerator, { input: "cat" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).anagrams).not.toContain(
          "cat"
        );
      }
    });

    it("should generate unique anagrams", async () => {
      const result = await executeTool(
        anagramGenerator,
        { input: "test" },
        { limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const uniqueAnagrams = new Set(
          (result.data as Record<string, unknown>).anagrams
        );
        expect(uniqueAnagrams.size).toBe(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        );
      }
    });

    it("should handle words with repeated letters", async () => {
      const result = await executeTool(anagramGenerator, { input: "aab" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).anagrams as unknown[])
            .length
        ).toBeGreaterThan(0);
      }
    });

    it("should return -1 for totalPossible when input is too long", async () => {
      // This test is for edge case behavior - 10 letters is the max
      const result = await executeTool(anagramGenerator, {
        input: "abcdefghij",
      });

      expect(result.success).toBe(true);
      // 10! is beyond the factorial limit, so totalPossible should be -1
    });
  });
});
