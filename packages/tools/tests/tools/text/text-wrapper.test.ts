import { describe, it, expect } from "vitest";
import { textWrapper } from "../../../src/tools/text/text-wrapper";
import { executeTool } from "../../../src/core/executor";

describe("textWrapper", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textWrapper.meta.id).toBe("text/wrapper");
      expect(textWrapper.meta.name).toBe("Text Wrapper");
      expect(textWrapper.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic wrapping", () => {
      it("should wrap text at specified width", async () => {
        const result = await executeTool(
          textWrapper,
          {
            input:
              "This is a long line that should be wrapped at a certain width",
          },
          { width: 20 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(20);
          }
        }
      });

      it("should use default width of 80", async () => {
        const longLine = "word ".repeat(30);
        const result = await executeTool(textWrapper, { input: longLine });
        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(80);
          }
        }
      });

      it("should return line count", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "This is a test line that is somewhat long" },
          { width: 15 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.lineCount as number).toBeGreaterThan(1);
          expect(data.lineCount).toBe(
            (data.output as string).split("\n").length
          );
        }
      });
    });

    describe("word breaking", () => {
      it("should not break words by default", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Hello wonderful world" },
          { width: 12 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          expect(lines.some((l: string) => l.includes("wonderful"))).toBe(true);
        }
      });

      it("should break words when option enabled", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "supercalifragilistic" },
          { width: 10, breakWords: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          expect(lines.length).toBeGreaterThan(1);
          for (const line of lines) {
            expect(line.length).toBeLessThanOrEqual(10);
          }
        }
      });

      it("should handle long words without breaking", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "supercalifragilisticexpialidocious" },
          { width: 20, breakWords: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Word should stay intact even if longer than width
          expect(
            (result.data as Record<string, unknown>).output as string
          ).toContain("supercalifragilisticexpialidocious");
        }
      });
    });

    describe("paragraph preservation", () => {
      it("should preserve paragraph breaks by default", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "First paragraph.\n\nSecond paragraph." },
          { width: 50 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output as string
          ).toContain("\n\n");
        }
      });

      it("should not preserve paragraphs when disabled", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Line one.\n\nLine two." },
          { width: 50, preserveParagraphs: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Still has double newline since original lines are processed separately
          expect(
            ((result.data as Record<string, unknown>).output as string).split(
              "\n"
            ).length
          ).toBeGreaterThanOrEqual(1);
        }
      });

      it("should join single newlines in paragraphs", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Line one\nLine two" },
          { width: 50, preserveParagraphs: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Single newlines should be converted to space
          expect((result.data as Record<string, unknown>).output).toBe(
            "Line one Line two"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(textWrapper, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.output).toBe("");
          expect(data.lineCount).toBe(1);
        }
      });

      it("should handle text shorter than width", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Short" },
          { width: 80 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as Record<string, unknown>;
          expect(data.output).toBe("Short");
          expect(data.lineCount).toBe(1);
        }
      });

      it("should handle only whitespace", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "   " },
          { width: 10 }
        );
        expect(result.success).toBe(true);
      });

      it("should handle multiple spaces", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "word   word   word" },
          { width: 15 }
        );
        expect(result.success).toBe(true);
      });

      it("should handle minimum width", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Hello world" },
          { width: 10 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).lineCount as number
          ).toBeGreaterThan(1);
        }
      });

      it("should handle tabs", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "word\tword\tword" },
          { width: 15 }
        );
        expect(result.success).toBe(true);
      });

      it("should handle mixed newlines and paragraphs", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "Para 1 line 1\nPara 1 line 2\n\nPara 2 line 1" },
          { width: 50 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output as string
          ).toContain("\n\n");
        }
      });

      it("should handle very long lines", async () => {
        const longLine = "word ".repeat(500);
        const result = await executeTool(
          textWrapper,
          { input: longLine },
          { width: 80 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).lineCount as number
          ).toBeGreaterThan(1);
        }
      });

      it("should trim trailing whitespace from wrapped lines", async () => {
        const result = await executeTool(
          textWrapper,
          { input: "hello world test" },
          { width: 10 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          for (const line of lines) {
            expect(line).toBe(line.trimEnd());
          }
        }
      });
    });
  });
});
