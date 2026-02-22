import { describe, it, expect } from "vitest";
import { readingTime } from "../../../src/tools/text/reading-time";
import { executeTool } from "../../../src/core/executor";

describe("readingTime", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(readingTime.meta.id).toBe("text/reading-time");
      expect(readingTime.meta.name).toBe("Reading Time");
      expect(readingTime.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic calculation", () => {
      it("should calculate reading time for short text", async () => {
        // 10 words at 200 WPM = 3 seconds
        const result = await executeTool(readingTime, {
          input: "one two three four five six seven eight nine ten",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.wordCount).toBe(10);
          expect(data.seconds).toBe(3);
          expect(data.minutes).toBe(0.05);
        }
      });

      it("should calculate reading time for longer text", async () => {
        // 200 words at 200 WPM = 1 minute
        const words = Array(200).fill("word").join(" ");
        const result = await executeTool(readingTime, { input: words });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.wordCount).toBe(200);
          expect(data.minutes).toBe(1);
          expect(data.seconds).toBe(60);
        }
      });

      it("should return formatted string", async () => {
        const result = await executeTool(readingTime, {
          input: "This is a test sentence for reading time.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).formatted as string
          ).toMatch(/\d+\s+(sec|min|hr)/);
        }
      });
    });

    describe("options", () => {
      it("should use custom wordsPerMinute", async () => {
        const words = Array(100).fill("word").join(" ");
        const result = await executeTool(
          readingTime,
          { input: words },
          { wordsPerMinute: 100 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.wordsPerMinute).toBe(100);
          expect(data.minutes).toBe(1); // 100 words / 100 WPM = 1 min
        }
      });

      it("should add time for images", async () => {
        const result = await executeTool(
          readingTime,
          { input: "Short text" },
          { includeImages: 5 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // 5 images * 12 seconds = 60 seconds
          expect(
            (result.data as Record<string, unknown>).seconds as number
          ).toBeGreaterThanOrEqual(60);
        }
      });

      it("should use default 200 WPM", async () => {
        const result = await executeTool(readingTime, {
          input: "This is a test",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).wordsPerMinute).toBe(
            200
          );
        }
      });
    });

    describe("formatted output", () => {
      it("should format seconds for very short text", async () => {
        const result = await executeTool(readingTime, { input: "Hello world" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).formatted as string
          ).toContain("sec");
        }
      });

      it("should format minutes for medium text", async () => {
        const words = Array(400).fill("word").join(" ");
        const result = await executeTool(readingTime, { input: words });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).formatted as string
          ).toContain("min");
        }
      });

      it("should format hours for very long text", async () => {
        const words = Array(15000).fill("word").join(" ");
        const result = await executeTool(readingTime, { input: words });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).formatted as string
          ).toContain("hr");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(readingTime, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.wordCount).toBe(0);
          expect(data.seconds).toBe(0);
          expect(data.minutes).toBe(0);
        }
      });

      it("should handle whitespace only", async () => {
        const result = await executeTool(readingTime, { input: "   \n\t   " });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).wordCount).toBe(0);
        }
      });

      it("should handle single word", async () => {
        const result = await executeTool(readingTime, { input: "Hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).wordCount).toBe(1);
        }
      });

      it("should handle text with multiple spaces", async () => {
        const result = await executeTool(readingTime, {
          input: "word   word   word",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).wordCount).toBe(3);
        }
      });

      it("should handle newlines and tabs", async () => {
        const result = await executeTool(readingTime, {
          input: "word\nword\tword",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).wordCount).toBe(3);
        }
      });

      it("should round seconds correctly", async () => {
        const result = await executeTool(readingTime, {
          input: "one two three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            Number.isInteger((result.data as Record<string, unknown>).seconds)
          ).toBe(true);
        }
      });

      it("should round minutes correctly", async () => {
        const result = await executeTool(readingTime, {
          input: "word ".repeat(50),
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          // Check that minutes is rounded to 2 decimal places
          const decimals = (
            (data.minutes as number).toString().split(".")[1] || ""
          ).length;
          expect(decimals).toBeLessThanOrEqual(2);
        }
      });
    });
  });
});
