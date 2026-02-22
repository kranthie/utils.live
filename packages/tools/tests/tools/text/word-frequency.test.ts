import { describe, it, expect } from "vitest";
import { wordFrequency } from "../../../src/tools/text/word-frequency";
import { executeTool } from "../../../src/core/executor";

describe("wordFrequency", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(wordFrequency.meta.id).toBe("text/word-frequency");
      expect(wordFrequency.meta.name).toBe("Word Frequency");
      expect(wordFrequency.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic frequency counting", () => {
      it("should count word frequencies", async () => {
        const result = await executeTool(wordFrequency, {
          input: "hello world hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          const helloFreq = frequencies.find(
            (f: Record<string, unknown>) => f.word === "hello"
          );
          expect(helloFreq?.count).toBe(2);
        }
      });

      it("should sort by frequency descending", async () => {
        const result = await executeTool(wordFrequency, {
          input: "a b b c c c",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(frequencies[0]?.word).toBe("c");
          expect(frequencies[0]?.count).toBe(3);
        }
      });

      it("should calculate percentages", async () => {
        const result = await executeTool(wordFrequency, {
          input: "a a a a b",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          const aFreq = frequencies.find(
            (f: Record<string, unknown>) => f.word === "a"
          );
          expect(aFreq?.percentage).toBe(80); // 4/5 * 100
        }
      });

      it("should return total word count", async () => {
        const result = await executeTool(wordFrequency, {
          input: "one two three four five",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).totalWords).toBe(5);
        }
      });

      it("should return unique word count", async () => {
        const result = await executeTool(wordFrequency, {
          input: "hello world hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).uniqueWords).toBe(2);
        }
      });
    });

    describe("options", () => {
      it("should be case-insensitive by default", async () => {
        const result = await executeTool(wordFrequency, {
          input: "Hello HELLO hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(data.uniqueWords).toBe(1);
          expect(frequencies[0]?.count).toBe(3);
        }
      });

      it("should be case-sensitive when enabled", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "Hello HELLO hello" },
          { caseSensitive: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).uniqueWords).toBe(3);
        }
      });

      it("should respect minLength option", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "a an the hello world" },
          { minLength: 3 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          // "a" and "an" should be excluded
          expect(
            frequencies.every(
              (f: Record<string, unknown>) => (f.word as string).length >= 3
            )
          ).toBe(true);
        }
      });

      it("should respect limit option", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "a b c d e f g h i j k" },
          { limit: 5 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(frequencies.length).toBeLessThanOrEqual(5);
        }
      });

      it("should exclude common stop words when enabled", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "the quick brown fox and the lazy dog" },
          { excludeCommon: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          const hasThe = frequencies.some(
            (f: Record<string, unknown>) => f.word === "the"
          );
          const hasAnd = frequencies.some(
            (f: Record<string, unknown>) => f.word === "and"
          );
          expect(hasThe).toBe(false);
          expect(hasAnd).toBe(false);
        }
      });

      it("should not exclude stop words by default", async () => {
        const result = await executeTool(wordFrequency, {
          input: "the the the",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(frequencies[0]?.word).toBe("the");
        }
      });
    });

    describe("punctuation handling", () => {
      it("should strip punctuation from words", async () => {
        const result = await executeTool(wordFrequency, {
          input: "hello, world! hello?",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(data.uniqueWords).toBe(2);
          expect(
            frequencies.some((f: Record<string, unknown>) => f.word === "hello")
          ).toBe(true);
        }
      });

      it("should preserve apostrophes in contractions", async () => {
        const result = await executeTool(wordFrequency, {
          input: "don't can't won't",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(
            frequencies.some((f: Record<string, unknown>) =>
              (f.word as string).includes("'")
            )
          ).toBe(true);
        }
      });

      it("should preserve hyphens", async () => {
        const result = await executeTool(wordFrequency, {
          input: "well-known user-friendly",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(
            frequencies.some((f: Record<string, unknown>) =>
              (f.word as string).includes("-")
            )
          ).toBe(true);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(wordFrequency, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.frequencies).toEqual([]);
          expect(data.totalWords).toBe(0);
          expect(data.uniqueWords).toBe(0);
        }
      });

      it("should handle only punctuation", async () => {
        const result = await executeTool(wordFrequency, {
          input: "!@#$%^&*()",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).uniqueWords).toBe(0);
        }
      });

      it("should handle single word", async () => {
        const result = await executeTool(wordFrequency, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(frequencies.length).toBe(1);
          expect(frequencies[0]?.percentage).toBe(100);
        }
      });

      it("should handle numbers", async () => {
        const result = await executeTool(wordFrequency, {
          input: "123 456 123",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          expect(
            frequencies.some((f: Record<string, unknown>) => f.word === "123")
          ).toBe(true);
        }
      });

      it("should handle long text", async () => {
        const longText = "word ".repeat(1000);
        const result = await executeTool(wordFrequency, { input: longText });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.totalWords).toBe(1000);
          expect(data.uniqueWords).toBe(1);
        }
      });

      it("should handle special characters in text", async () => {
        const result = await executeTool(wordFrequency, {
          input: "hello@world.com test@example.org",
        });
        expect(result.success).toBe(true);
      });

      it("should handle all words filtered by minLength", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "a an at" },
          { minLength: 5 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).frequencies).toEqual(
            []
          );
        }
      });

      it("should handle all words excluded by stop words", async () => {
        const result = await executeTool(
          wordFrequency,
          { input: "the and but or" },
          { excludeCommon: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).frequencies).toEqual(
            []
          );
        }
      });

      it("should round percentages correctly", async () => {
        const result = await executeTool(wordFrequency, {
          input: "a a a b b c",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const frequencies = data.frequencies as Record<string, unknown>[];
          for (const freq of frequencies) {
            const decimals = (
              (freq.percentage as number).toString().split(".")[1] || ""
            ).length;
            expect(decimals).toBeLessThanOrEqual(2);
          }
        }
      });
    });
  });
});
