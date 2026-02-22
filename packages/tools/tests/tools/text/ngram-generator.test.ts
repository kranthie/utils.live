import { describe, it, expect } from "vitest";
import { ngramGenerator } from "../../../src/tools/text/ngram-generator";
import { executeTool } from "../../../src/core/executor";

describe("ngramGenerator", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(ngramGenerator.meta.id).toBe("text/ngram-generator");
      expect(ngramGenerator.meta.name).toBe("N-gram Generator");
      expect(ngramGenerator.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("word n-grams", () => {
      it("should generate bigrams by default", async () => {
        const result = await executeTool(ngramGenerator, {
          input: "the quick brown fox jumps over the lazy dog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          expect(ngrams).toBeInstanceOf(Array);
          expect(data.totalNgrams).toBe(8); // 9 words - 1 = 8 bigrams
          expect(data.uniqueNgrams).toBeGreaterThan(0);
          // Check first n-gram structure
          expect(ngrams[0]).toHaveProperty("ngram");
          expect(ngrams[0]).toHaveProperty("count");
          expect(ngrams[0]).toHaveProperty("percentage");
        }
      });

      it("should generate trigrams when n=3", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "one two three four five" },
          { n: 3 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          expect(data.totalNgrams).toBe(3); // 5 words - 2 = 3 trigrams
          expect((ngrams[0]?.ngram as string).split(" ").length).toBe(3);
        }
      });

      it("should count repeated n-grams", async () => {
        const result = await executeTool(ngramGenerator, {
          input: "a b a b a b",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          // "a b" appears 3 times, "b a" appears 2 times
          const abNgram = ngrams.find(
            (n: Record<string, unknown>) => n.ngram === "a b"
          );
          expect(abNgram?.count).toBe(3);
        }
      });

      it("should be case-insensitive by default", async () => {
        const result = await executeTool(ngramGenerator, {
          input: "Hello World hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          const helloWorld = ngrams.find(
            (n: Record<string, unknown>) => n.ngram === "hello world"
          );
          expect(helloWorld?.count).toBe(2);
        }
      });

      it("should be case-sensitive when option enabled", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "Hello World hello world" },
          { caseSensitive: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          const helloWorld = ngrams.find(
            (n: Record<string, unknown>) => n.ngram === "Hello World"
          );
          const helloWorldLower = ngrams.find(
            (n: Record<string, unknown>) => n.ngram === "hello world"
          );
          expect(helloWorld?.count).toBe(1);
          expect(helloWorldLower?.count).toBe(1);
        }
      });
    });

    describe("character n-grams", () => {
      it("should generate character n-grams", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "hello" },
          { type: "character", n: 2 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          expect(data.totalNgrams).toBe(4); // "he", "el", "ll", "lo"
          expect(
            ngrams.some((n: Record<string, unknown>) => n.ngram === "he")
          ).toBe(true);
          expect(
            ngrams.some((n: Record<string, unknown>) => n.ngram === "ll")
          ).toBe(true);
        }
      });

      it("should handle spaces in character n-grams", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "a b" },
          { type: "character", n: 2 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          expect(
            ngrams.some((n: Record<string, unknown>) => n.ngram === "a ")
          ).toBe(true);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(ngramGenerator, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.ngrams).toEqual([]);
          expect(data.totalNgrams).toBe(0);
          expect(data.uniqueNgrams).toBe(0);
        }
      });

      it("should handle single word input", async () => {
        const result = await executeTool(ngramGenerator, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.ngrams).toEqual([]);
          expect(data.totalNgrams).toBe(0);
        }
      });

      it("should handle input shorter than n", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "hello world" },
          { n: 5 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).ngrams).toEqual([]);
        }
      });

      it("should respect limit option", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "a b c d e f g h i j" },
          { limit: 3 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          expect(ngrams.length).toBeLessThanOrEqual(3);
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool(
          ngramGenerator,
          { input: "cafe" },
          { type: "character", n: 2 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).totalNgrams
          ).toBeGreaterThan(0);
        }
      });

      it("should calculate percentages correctly", async () => {
        const result = await executeTool(ngramGenerator, {
          input: "a b a b a b a b",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const ngrams = data.ngrams as Record<string, unknown>[];
          const totalPercentage = ngrams.reduce(
            (sum: number, n: Record<string, unknown>) =>
              sum + (n.percentage as number),
            0
          );
          expect(Math.round(totalPercentage)).toBeCloseTo(100, 0);
        }
      });
    });
  });
});
