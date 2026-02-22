import { describe, it, expect } from "vitest";
import { keywordExtractor } from "../../../src/tools/text/keyword-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("keywordExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(keywordExtractor.meta.id).toBe("text/keyword-extractor");
      expect(keywordExtractor.meta.name).toBe("Keyword Extractor");
      expect(keywordExtractor.meta.category).toBe("text");
      expect(keywordExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(keywordExtractor.meta.keywords).toContain("keyword");
      expect(keywordExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract keywords from text", async () => {
      const result = await executeTool(keywordExtractor, {
        input:
          "JavaScript is a programming language. JavaScript is used for web development.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).keywords as unknown[])
            .length
        ).toBeGreaterThan(0);
        // JavaScript should be a top keyword
        const jsKeyword = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).find((k: Record<string, unknown>) => k.word === "javascript");
        expect(jsKeyword).toBeDefined();
      }
    });

    it("should respect limit option", async () => {
      const result = await executeTool(
        keywordExtractor,
        {
          input: "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10",
        },
        { limit: 5 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).keywords as unknown[])
            .length
        ).toBeLessThanOrEqual(5);
      }
    });

    it("should respect minLength option", async () => {
      const result = await executeTool(
        keywordExtractor,
        { input: "a an the programming language development" },
        { minLength: 5 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        for (const keyword of (result.data as Record<string, unknown>)
          .keywords as Record<string, unknown>[]) {
          expect((keyword.word as string).length).toBeGreaterThanOrEqual(5);
        }
      }
    });

    it("should filter stop words by default", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "the quick brown fox jumps over the lazy dog",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).map((k: Record<string, unknown>) => k.word);
        expect(words).not.toContain("the");
        // "over" may not be in stop words list, just verify common stop words are filtered
      }
    });

    it("should include stop words when option is false", async () => {
      const result = await executeTool(
        keywordExtractor,
        { input: "the the the programming" },
        { stopWords: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).map((k: Record<string, unknown>) => k.word);
        expect(words).toContain("the");
      }
    });

    it("should return keywords with count", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "test test test other word",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const testKeyword = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).find((k: Record<string, unknown>) => k.word === "test");
        expect(testKeyword?.count).toBe(3);
      }
    });

    it("should return keywords with score", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "programming is fun",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const keyword of (result.data as Record<string, unknown>)
          .keywords as Record<string, unknown>[]) {
          expect(typeof keyword.score).toBe("number");
          expect(keyword.score).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should sort keywords by score descending", async () => {
      const result = await executeTool(keywordExtractor, {
        input:
          "programming programming programming language language development",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        for (
          let i = 0;
          i <
          ((result.data as Record<string, unknown>).keywords as unknown[])
            .length -
            1;
          i++
        ) {
          const current = (
            (result.data as Record<string, unknown>).keywords as Record<
              string,
              unknown
            >[]
          )[i];
          const next = (
            (result.data as Record<string, unknown>).keywords as Record<
              string,
              unknown
            >[]
          )[i + 1];
          if (current && next) {
            expect(current.score as number).toBeGreaterThanOrEqual(
              next.score as number
            );
          }
        }
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(keywordExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).keywords).toEqual([]);
      }
    });

    it("should handle input with only stop words", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "the and or but in on",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).keywords).toEqual([]);
      }
    });

    it("should handle punctuation", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "Hello, world! Programming is great.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).map((k: Record<string, unknown>) => k.word);
        // Punctuation should be removed
        expect(words.some((w: string) => w.includes(","))).toBe(false);
        expect(words.some((w: string) => w.includes("!"))).toBe(false);
      }
    });

    it("should convert to lowercase", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "JavaScript JavaScript JAVASCRIPT",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const jsKeyword = (
          (result.data as Record<string, unknown>).keywords as unknown[]
        ).find((k: Record<string, unknown>) => k.word === "javascript");
        expect(jsKeyword).toBeDefined();
        expect(jsKeyword?.count).toBe(3);
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "programming\nlanguage\ndevelopment",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).keywords as unknown[])
            .length
        ).toBe(3);
      }
    });

    it("should handle default options", async () => {
      const result = await executeTool(keywordExtractor, {
        input: "TypeScript is a typed programming language",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Default limit is 10
        expect(
          ((result.data as Record<string, unknown>).keywords as unknown[])
            .length
        ).toBeLessThanOrEqual(10);
      }
    });
  });
});
