import { describe, it, expect } from "vitest";
import { textStatistics } from "../../../src/tools/text/text-statistics";
import { executeTool } from "../../../src/core/executor";

describe("textStatistics", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textStatistics.meta.id).toBe("text/statistics");
      expect(textStatistics.meta.name).toBe("Text Statistics");
      expect(textStatistics.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic counts", () => {
      it("should count characters", async () => {
        const result = await executeTool(textStatistics, {
          input: "Hello World",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.characters
          ).toBe(11);
        }
      });

      it("should count characters without spaces", async () => {
        const result = await executeTool(textStatistics, {
          input: "Hello World",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.charactersNoSpaces
          ).toBe(10);
        }
      });

      it("should count words", async () => {
        const result = await executeTool(textStatistics, {
          input: "one two three four five",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.words).toBe(5);
        }
      });

      it("should count unique words", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello world hello earth",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.uniqueWords
          ).toBe(3); // hello, world, earth
        }
      });

      it("should count sentences", async () => {
        const result = await executeTool(textStatistics, {
          input: "First sentence. Second sentence. Third?",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.sentences).toBe(
            3
          );
        }
      });

      it("should count paragraphs", async () => {
        const result = await executeTool(textStatistics, {
          input: "Para 1.\n\nPara 2.\n\nPara 3.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.paragraphs
          ).toBe(3);
        }
      });

      it("should count lines", async () => {
        const result = await executeTool(textStatistics, {
          input: "line1\nline2\nline3",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.lines).toBe(3);
        }
      });
    });

    describe("averages", () => {
      it("should calculate average word length", async () => {
        const result = await executeTool(textStatistics, {
          input: "one two three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // one=3, two=3, three=5, avg = 11/3 = 3.67
          expect(
            (result.data as Record<string, unknown>).averages.wordLength
          ).toBeCloseTo(3.67, 1);
        }
      });

      it("should calculate average words per sentence", async () => {
        const result = await executeTool(textStatistics, {
          input: "One two three. Four five.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // 5 words / 2 sentences = 2.5
          expect(
            (result.data as Record<string, unknown>).averages.wordsPerSentence
          ).toBe(2.5);
        }
      });

      it("should calculate average sentences per paragraph", async () => {
        const result = await executeTool(textStatistics, {
          input: "First. Second.\n\nThird. Fourth. Fifth.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // Para 1: 2 sentences, Para 2: 3 sentences, avg = 2.5
          expect(
            (result.data as Record<string, unknown>).averages
              .sentencesPerParagraph
          ).toBe(2.5);
        }
      });

      it("should calculate average syllables per word", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello world today",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).averages.syllablesPerWord
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("word length distribution", () => {
      it("should count short words (1-4 chars)", async () => {
        const result = await executeTool(textStatistics, {
          input: "a an the is at",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).distribution.shortWords
          ).toBe(5);
        }
      });

      it("should count medium words (5-8 chars)", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello world today",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).distribution.mediumWords
          ).toBe(3);
        }
      });

      it("should count long words (9+ chars)", async () => {
        const result = await executeTool(textStatistics, {
          input: "extraordinary complicated",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).distribution.longWords
          ).toBe(2);
        }
      });
    });

    describe("vocabulary metrics", () => {
      it("should calculate vocabulary richness (type-token ratio)", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello hello world world today",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // 3 unique / 5 total = 0.6
          expect(
            (result.data as Record<string, unknown>).vocabulary.richness
          ).toBe(0.6);
        }
      });

      it("should count hapax legomena", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello world world test test test",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // "hello" appears once
          expect(
            (result.data as Record<string, unknown>).vocabulary.hapaxLegomena
          ).toBe(1);
        }
      });

      it("should calculate richness correctly for unique words", async () => {
        const result = await executeTool(textStatistics, {
          input: "one two three four five",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).vocabulary.richness
          ).toBe(1); // All unique
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(textStatistics, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.characters
          ).toBe(0);
          expect((result.data as Record<string, unknown>).basic.words).toBe(0);
          expect(
            (result.data as Record<string, unknown>).averages.wordLength
          ).toBe(0);
          expect(
            (result.data as Record<string, unknown>).vocabulary.richness
          ).toBe(0);
        }
      });

      it("should handle single word", async () => {
        const result = await executeTool(textStatistics, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.words).toBe(1);
          expect(
            (result.data as Record<string, unknown>).basic.uniqueWords
          ).toBe(1);
        }
      });

      it("should handle whitespace only", async () => {
        const result = await executeTool(textStatistics, {
          input: "   \n\t   ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.words).toBe(0);
        }
      });

      it("should be case-insensitive for unique words", async () => {
        const result = await executeTool(textStatistics, {
          input: "Hello HELLO hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.uniqueWords
          ).toBe(1);
        }
      });

      it("should handle punctuation in unique word counting", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello, hello! hello?",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).basic.uniqueWords
          ).toBe(1);
        }
      });

      it("should handle long text", async () => {
        const longText = "word ".repeat(1000);
        const result = await executeTool(textStatistics, { input: longText });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.words).toBe(
            1000
          );
        }
      });

      it("should handle special characters", async () => {
        const result = await executeTool(textStatistics, {
          input: "hello @#$% world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).basic.words).toBe(3);
        }
      });
    });
  });
});
