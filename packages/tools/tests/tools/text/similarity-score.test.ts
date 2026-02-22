import { describe, it, expect } from "vitest";
import { similarityScore } from "../../../src/tools/text/similarity-score";
import { executeTool } from "../../../src/core/executor";

describe("similarityScore", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(similarityScore.meta.id).toBe("text/similarity-score");
      expect(similarityScore.meta.name).toBe("Similarity Score");
      expect(similarityScore.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("Levenshtein distance", () => {
      it("should return 0 distance for identical strings", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello",
          input2: "hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const lev = data.levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(0);
          expect(lev.similarity).toBe(100);
        }
      });

      it("should calculate correct distance for different strings", async () => {
        const result = await executeTool(similarityScore, {
          input1: "kitten",
          input2: "sitting",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(3);
        }
      });

      it("should calculate distance for completely different strings", async () => {
        const result = await executeTool(similarityScore, {
          input1: "abc",
          input2: "xyz",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(3);
        }
      });
    });

    describe("Jaccard similarity", () => {
      it("should return 1 for identical word sets", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello world",
          input2: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).jaccard).toBe(1);
        }
      });

      it("should return 0 for completely different word sets", async () => {
        const result = await executeTool(similarityScore, {
          input1: "apple banana",
          input2: "cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).jaccard).toBe(0);
        }
      });

      it("should return partial similarity for overlapping sets", async () => {
        const result = await executeTool(similarityScore, {
          input1: "apple banana cherry",
          input2: "banana cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // Common: banana, cherry (2), Union: apple, banana, cherry, date (4)
          // Jaccard = 2/4 = 0.5
          expect((result.data as Record<string, unknown>).jaccard).toBe(0.5);
        }
      });
    });

    describe("Cosine similarity", () => {
      it("should return 1 for identical texts", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello world hello",
          input2: "hello world hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).cosine).toBe(1);
        }
      });

      it("should return 0 for completely different texts", async () => {
        const result = await executeTool(similarityScore, {
          input1: "apple banana",
          input2: "cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).cosine).toBe(0);
        }
      });

      it("should consider word frequency", async () => {
        const result = await executeTool(similarityScore, {
          input1: "word word word",
          input2: "word word other",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.cosine as number).toBeGreaterThan(0);
          expect(data.cosine as number).toBeLessThan(1);
        }
      });
    });

    describe("Dice coefficient", () => {
      it("should return 1 for identical word sets", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello world",
          input2: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).dice).toBe(1);
        }
      });

      it("should return 0 for completely different word sets", async () => {
        const result = await executeTool(similarityScore, {
          input1: "apple banana",
          input2: "cherry date",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).dice).toBe(0);
        }
      });
    });

    describe("overall similarity", () => {
      it("should return 100 for identical texts", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello world",
          input2: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).overallSimilarity
          ).toBe(100);
        }
      });

      it("should return weighted average of all metrics", async () => {
        const result = await executeTool(similarityScore, {
          input1: "the quick brown fox",
          input2: "the slow red dog",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.overallSimilarity as number).toBeGreaterThan(0);
          expect(data.overallSimilarity as number).toBeLessThan(100);
        }
      });
    });

    describe("options", () => {
      it("should be case-insensitive by default", async () => {
        const result = await executeTool(similarityScore, {
          input1: "HELLO WORLD",
          input2: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(0);
        }
      });

      it("should be case-sensitive when option enabled", async () => {
        const result = await executeTool(
          similarityScore,
          {
            input1: "HELLO",
            input2: "hello",
          },
          { caseSensitive: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance as number).toBeGreaterThan(0);
        }
      });

      it("should ignore whitespace when option enabled", async () => {
        const result = await executeTool(
          similarityScore,
          {
            input1: "hello   world",
            input2: "hello world",
          },
          { ignoreWhitespace: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(0);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty inputs", async () => {
        const result = await executeTool(similarityScore, {
          input1: "",
          input2: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const lev = data.levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(0);
          expect(lev.similarity).toBe(100);
          expect(data.jaccard).toBe(0);
          expect(data.cosine).toBe(0);
        }
      });

      it("should handle one empty input", async () => {
        const result = await executeTool(similarityScore, {
          input1: "hello",
          input2: "",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(5);
          expect(lev.similarity).toBe(0);
        }
      });

      it("should handle single characters", async () => {
        const result = await executeTool(similarityScore, {
          input1: "a",
          input2: "b",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.distance).toBe(1);
        }
      });

      it("should handle long texts", async () => {
        const long1 = "word ".repeat(100);
        const long2 = "word ".repeat(100);
        const result = await executeTool(similarityScore, {
          input1: long1,
          input2: long2,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const lev = (result.data as Record<string, unknown>)
            .levenshtein as Record<string, unknown>;
          expect(lev.similarity).toBe(100);
        }
      });

      it("should round results properly", async () => {
        const result = await executeTool(similarityScore, {
          input1: "abc def ghi",
          input2: "abc xyz jkl",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          // Check that values are properly rounded
          const jaccardStr = (data.jaccard as number).toString();
          const decimalPlaces = jaccardStr.includes(".")
            ? (jaccardStr.split(".")[1]?.length ?? 0)
            : 0;
          expect(decimalPlaces).toBeLessThanOrEqual(3);
        }
      });
    });
  });
});
