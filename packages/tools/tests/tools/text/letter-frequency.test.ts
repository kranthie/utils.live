import { describe, it, expect } from "vitest";
import { letterFrequency } from "../../../src/tools/text/letter-frequency";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("letterFrequency", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(letterFrequency.meta.id).toBe("text/letter-frequency");
      expect(letterFrequency.meta.name).toBe("Letter Frequency");
      expect(letterFrequency.meta.category).toBe("text");
      expect(letterFrequency.meta.tier).toBe(ToolTier.CLIENT);
      expect(letterFrequency.meta.keywords).toContain("letter");
      expect(letterFrequency.meta.keywords).toContain("frequency");
    });
  });

  describe("execute", () => {
    it("should count letter frequencies", async () => {
      const result = await executeTool(letterFrequency, { input: "aabbcc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalLetters).toBe(6);
        const aFreq = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "a");
        expect(aFreq?.count).toBe(2);
        expect(aFreq?.percentage).toBeCloseTo(33.33, 1);
      }
    });

    it("should be case-insensitive by default", async () => {
      const result = await executeTool(letterFrequency, { input: "AaBbCc" });

      expect(result.success).toBe(true);
      if (result.success) {
        const aFreq = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "a");
        expect(aFreq?.count).toBe(2);
      }
    });

    it("should be case-sensitive when option is true", async () => {
      const result = await executeTool(
        letterFrequency,
        { input: "AaBbCc" },
        { caseSensitive: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const upperA = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "A");
        const lowerA = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "a");
        expect(upperA?.count).toBe(1);
        expect(lowerA?.count).toBe(1);
      }
    });

    it("should include all letters when option is true", async () => {
      const result = await executeTool(
        letterFrequency,
        { input: "abc" },
        { includeAll: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).frequencies as unknown[])
            .length
        ).toBe(26);
        const zFreq = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "z");
        expect(zFreq?.count).toBe(0);
      }
    });

    it("should identify most common letter", async () => {
      const result = await executeTool(letterFrequency, { input: "aaabbc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mostCommon).toBe("a");
      }
    });

    it("should identify least common letter", async () => {
      const result = await executeTool(letterFrequency, { input: "aaabbc" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).leastCommon).toBe("c");
      }
    });

    it("should count vowels", async () => {
      const result = await executeTool(letterFrequency, { input: "hello" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).vowelCount).toBe(2); // e, o
      }
    });

    it("should count consonants", async () => {
      const result = await executeTool(letterFrequency, { input: "hello" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).consonantCount).toBe(3); // h, l, l
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(letterFrequency, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalLetters).toBe(0);
        expect((result.data as Record<string, unknown>).vowelCount).toBe(0);
        expect((result.data as Record<string, unknown>).consonantCount).toBe(0);
      }
    });

    it("should ignore non-letter characters", async () => {
      const result = await executeTool(letterFrequency, {
        input: "a1b2c3!@#",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalLetters).toBe(3);
      }
    });

    it("should sort by frequency descending", async () => {
      const result = await executeTool(letterFrequency, { input: "aaabbcc" });

      expect(result.success).toBe(true);
      if (result.success) {
        const counts = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).map((f: Record<string, unknown>) => f.count);
        for (let i = 0; i < counts.length - 1; i++) {
          const current = counts[i];
          const next = counts[i + 1];
          if (current !== undefined && next !== undefined) {
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      }
    });

    it("should calculate correct percentages", async () => {
      const result = await executeTool(letterFrequency, { input: "aaaa" });

      expect(result.success).toBe(true);
      if (result.success) {
        const aFreq = (
          (result.data as Record<string, unknown>).frequencies as unknown[]
        ).find((f: Record<string, unknown>) => f.letter === "a");
        expect(aFreq?.percentage).toBe(100);
      }
    });

    it("should handle uppercase and lowercase vowels", async () => {
      const result = await executeTool(letterFrequency, {
        input: "AEIOUaeiou",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).vowelCount).toBe(10);
        expect((result.data as Record<string, unknown>).consonantCount).toBe(0);
      }
    });

    it("should handle spaces and punctuation", async () => {
      const result = await executeTool(letterFrequency, {
        input: "Hello, World!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalLetters).toBe(10);
      }
    });

    it("should handle numbers mixed with letters", async () => {
      const result = await executeTool(letterFrequency, {
        input: "abc123xyz",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).totalLetters).toBe(6);
      }
    });

    it("should include all 52 letters in case-sensitive mode with includeAll", async () => {
      const result = await executeTool(
        letterFrequency,
        { input: "a" },
        { caseSensitive: true, includeAll: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).frequencies as unknown[])
            .length
        ).toBe(52);
      }
    });
  });
});
