import { describe, it, expect } from "vitest";
import { readabilityScore } from "../../../src/tools/text/readability-score";
import { executeTool } from "../../../src/core/executor";

describe("readabilityScore", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(readabilityScore.meta.id).toBe("text/readability-score");
      expect(readabilityScore.meta.name).toBe("Readability Score");
      expect(readabilityScore.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic analysis", () => {
      it("should analyze simple text", async () => {
        const result = await executeTool(readabilityScore, {
          input: "The cat sat on the mat. It was a nice day.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const flesch = data.fleschReadingEase as Record<string, unknown>;
          expect(flesch).toBeDefined();
          expect(flesch.score as number).toBeGreaterThanOrEqual(0);
          expect(flesch.score as number).toBeLessThanOrEqual(100);
          expect(flesch.level).toBeDefined();
        }
      });

      it("should return all readability metrics", async () => {
        const result = await executeTool(readabilityScore, {
          input: "This is a simple sentence. Another sentence here.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.fleschKincaidGrade).toBeDefined();
          expect(data.gunningFog).toBeDefined();
          expect(data.colemanLiau).toBeDefined();
          expect(data.automatedReadability).toBeDefined();
          expect(data.smog).toBeDefined();
          expect(data.averageGradeLevel).toBeDefined();
        }
      });

      it("should provide stats", async () => {
        const result = await executeTool(readabilityScore, {
          input: "One two three four five.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.words).toBe(5);
          expect(stats.sentences).toBe(1);
          expect(stats.syllables as number).toBeGreaterThan(0);
        }
      });

      it("should count complex words", async () => {
        const result = await executeTool(readabilityScore, {
          input:
            "The complicated methodology demonstrates interesting possibilities.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          // "complicated", "methodology", "demonstrates", "interesting", "possibilities" have 3+ syllables
          expect(stats.complexWords as number).toBeGreaterThan(0);
        }
      });
    });

    describe("readability levels", () => {
      it("should rate simple text as easy", async () => {
        const result = await executeTool(readabilityScore, {
          input: "The dog ran. The cat sat. I am here.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const flesch = (result.data as Record<string, unknown>)
            .fleschReadingEase as Record<string, unknown>;
          expect(flesch.score as number).toBeGreaterThan(60);
        }
      });

      it("should rate complex text as difficult", async () => {
        const result = await executeTool(readabilityScore, {
          input:
            "The epistemological ramifications of phenomenological investigations into consciousness fundamentally challenge our presuppositions regarding the ontological status of subjective experience.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const flesch = data.fleschReadingEase as Record<string, unknown>;
          expect(flesch.score as number).toBeLessThan(50);
          expect(data.averageGradeLevel as number).toBeGreaterThan(10);
        }
      });
    });

    describe("Flesch level descriptions", () => {
      it("should return Very Easy for score >= 90", async () => {
        const result = await executeTool(readabilityScore, {
          input: "Go. Run. Sit.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const flesch = (result.data as Record<string, unknown>)
            .fleschReadingEase as Record<string, unknown>;
          if ((flesch.score as number) >= 90) {
            expect(flesch.level as string).toContain("Very Easy");
          }
        }
      });

      it("should provide appropriate level for score", async () => {
        const result = await executeTool(readabilityScore, {
          input: "This is a moderately complex sentence with some variation.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const flesch = (result.data as Record<string, unknown>)
            .fleschReadingEase as Record<string, unknown>;
          expect(flesch.level).toBeDefined();
          expect((flesch.level as string).length).toBeGreaterThan(0);
        }
      });
    });

    describe("summary generation", () => {
      it("should provide summary for elementary level", async () => {
        const result = await executeTool(readabilityScore, {
          input: "See the dog run. The cat is fat.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).summary
          ).toBeDefined();
        }
      });

      it("should provide summary for college level", async () => {
        const result = await executeTool(readabilityScore, {
          input:
            "The implementation of algorithmic solutions requires careful consideration of computational complexity and efficiency metrics.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).summary
          ).toBeDefined();
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(readabilityScore, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          const flesch = data.fleschReadingEase as Record<string, unknown>;
          const stats = data.stats as Record<string, unknown>;
          expect(flesch.score).toBe(0);
          expect(flesch.level).toBe("N/A - No text");
          expect(data.summary).toBe("No text to analyze");
          expect(stats.words).toBe(0);
        }
      });

      it("should handle single word", async () => {
        const result = await executeTool(readabilityScore, { input: "Hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.words).toBe(1);
        }
      });

      it("should handle text without punctuation", async () => {
        const result = await executeTool(readabilityScore, {
          input: "This is text without punctuation",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.sentences).toBe(1);
        }
      });

      it("should handle multiple sentence types", async () => {
        const result = await executeTool(readabilityScore, {
          input: "Is this a question? Yes! It is a statement.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.sentences).toBe(3);
        }
      });

      it("should clamp Flesch score between 0 and 100", async () => {
        const result = await executeTool(readabilityScore, {
          input: "A. B. C. D. E. F. G. H. I. J.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const flesch = (result.data as Record<string, unknown>)
            .fleschReadingEase as Record<string, unknown>;
          expect(flesch.score as number).toBeLessThanOrEqual(100);
          expect(flesch.score as number).toBeGreaterThanOrEqual(0);
        }
      });

      it("should ensure minimum 0 for grade levels", async () => {
        const result = await executeTool(readabilityScore, {
          input: "A. B. C.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.fleschKincaidGrade as number).toBeGreaterThanOrEqual(0);
          expect(data.gunningFog as number).toBeGreaterThanOrEqual(0);
          expect(data.colemanLiau as number).toBeGreaterThanOrEqual(0);
          expect(data.automatedReadability as number).toBeGreaterThanOrEqual(0);
          expect(data.smog as number).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe("syllable counting", () => {
      it("should count syllables correctly for simple words", async () => {
        const result = await executeTool(readabilityScore, {
          input: "Hello world today.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          // "Hello" = 2, "world" = 1, "today" = 2
          expect(stats.syllables as number).toBeGreaterThanOrEqual(4);
        }
      });

      it("should count minimum 1 syllable per word", async () => {
        const result = await executeTool(readabilityScore, {
          input: "A b c d e.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const stats = (result.data as Record<string, unknown>)
            .stats as Record<string, unknown>;
          expect(stats.syllables as number).toBeGreaterThanOrEqual(5);
        }
      });
    });
  });
});
