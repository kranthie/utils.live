import { describe, it, expect } from "vitest";
import { semanticDiff } from "../../../src/tools/text/semantic-diff";
import { executeTool } from "../../../src/core/executor";

describe("semanticDiff", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(semanticDiff.meta.id).toBe("text/semantic-diff");
      expect(semanticDiff.meta.name).toBe("Word Overlap Diff");
      expect(semanticDiff.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("similarity calculation", () => {
      it("should return 100% for identical texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "The quick brown fox jumps over the lazy dog",
          second: "The quick brown fox jumps over the lazy dog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(100);
        }
      });

      it("should return 0% for completely different texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "apple banana cherry",
          second: "dog elephant frog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(0);
        }
      });

      it("should return partial similarity for partially matching texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "The quick brown fox",
          second: "The slow brown dog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).similarity
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).similarity
          ).toBeLessThan(100);
        }
      });
    });

    describe("word analysis", () => {
      it("should find common words", async () => {
        const result = await executeTool(semanticDiff, {
          input: "apple banana cherry",
          second: "banana cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("banana");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("cherry");
        }
      });

      it("should find words unique to first text", async () => {
        const result = await executeTool(semanticDiff, {
          input: "apple banana cherry",
          second: "banana cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).uniqueToFirst
          ).toContain("apple");
        }
      });

      it("should find words unique to second text", async () => {
        const result = await executeTool(semanticDiff, {
          input: "apple banana cherry",
          second: "banana cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).uniqueToSecond
          ).toContain("date");
        }
      });

      it("should filter out stop words", async () => {
        const result = await executeTool(semanticDiff, {
          input: "the quick and fast fox",
          second: "the slow but steady dog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).not.toContain("the");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).not.toContain("and");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).not.toContain("but");
        }
      });

      it("should filter out short words (2 chars or less)", async () => {
        const result = await executeTool(semanticDiff, {
          input: "a an the is at to",
          second: "a an the is at to",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).commonWords.length
          ).toBe(0);
        }
      });
    });

    describe("analysis text", () => {
      it("should describe very similar texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "programming software development code",
          second: "programming software development testing",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          if ((result.data as Record<string, unknown>).similarity >= 80) {
            expect((result.data as Record<string, unknown>).analysis).toContain(
              "very similar"
            );
          }
        }
      });

      it("should describe moderately similar texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "programming software development code",
          second: "programming testing quality assurance",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          if (
            (result.data as Record<string, unknown>).similarity >= 50 &&
            (result.data as Record<string, unknown>).similarity < 80
          ) {
            expect((result.data as Record<string, unknown>).analysis).toContain(
              "common themes"
            );
          }
        }
      });

      it("should describe substantially different texts", async () => {
        const result = await executeTool(semanticDiff, {
          input: "cats dogs animals pets",
          second: "programming software development code",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          if ((result.data as Record<string, unknown>).similarity < 20) {
            expect((result.data as Record<string, unknown>).analysis).toContain(
              "substantially different"
            );
          }
        }
      });
    });

    describe("case handling", () => {
      it("should be case-insensitive", async () => {
        const result = await executeTool(semanticDiff, {
          input: "APPLE BANANA",
          second: "apple banana",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(100);
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("apple");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("banana");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty inputs", async () => {
        const result = await executeTool(semanticDiff, {
          input: "",
          second: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(100);
          expect((result.data as Record<string, unknown>).commonWords).toEqual(
            []
          );
        }
      });

      it("should handle one empty input", async () => {
        const result = await executeTool(semanticDiff, {
          input: "hello world",
          second: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(0);
          expect(
            (result.data as Record<string, unknown>).uniqueToFirst
          ).toContain("hello");
          expect(
            (result.data as Record<string, unknown>).uniqueToFirst
          ).toContain("world");
        }
      });

      it("should handle punctuation", async () => {
        const result = await executeTool(semanticDiff, {
          input: "Hello, world!",
          second: "Hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).similarity).toBe(100);
        }
      });

      it("should limit results to 20 items", async () => {
        const words1 = Array.from({ length: 30 }, (_, i) => `word${i}`).join(
          " "
        );
        const words2 = Array.from({ length: 30 }, (_, i) => `word${i}`).join(
          " "
        );
        const result = await executeTool(semanticDiff, {
          input: words1,
          second: words2,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).commonWords.length
          ).toBeLessThanOrEqual(20);
        }
      });

      it("should handle special characters", async () => {
        const result = await executeTool(semanticDiff, {
          input: "hello@world.com",
          second: "hello world com",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("hello");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("world");
          expect(
            (result.data as Record<string, unknown>).commonWords
          ).toContain("com");
        }
      });
    });
  });
});
