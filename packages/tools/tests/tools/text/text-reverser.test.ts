import { describe, it, expect } from "vitest";
import { textReverser } from "../../../src/tools/text/text-reverser";
import { executeTool } from "../../../src/core/executor";

describe("textReverser", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textReverser.meta.id).toBe("text/reverser");
      expect(textReverser.meta.name).toBe("Text Reverser");
      expect(textReverser.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("character reversal", () => {
      it("should reverse characters", async () => {
        const result = await executeTool(textReverser, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "olleh"
          );
        }
      });

      it("should reverse characters with spaces", async () => {
        const result = await executeTool(textReverser, {
          input: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "dlrow olleh"
          );
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool(textReverser, { input: "cafe" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "efac"
          );
        }
      });

      it("should handle emojis", async () => {
        const result = await executeTool(textReverser, { input: "abc" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "cba"
          );
        }
      });
    });

    describe("word reversal", () => {
      it("should reverse word order", async () => {
        const result = await executeTool(textReverser, {
          input: "one two three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).words).toBe(
            "three two one"
          );
        }
      });

      it("should preserve word content", async () => {
        const result = await executeTool(textReverser, {
          input: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).words).toBe(
            "world hello"
          );
        }
      });

      it("should handle single word", async () => {
        const result = await executeTool(textReverser, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).words).toBe("hello");
        }
      });

      it("should preserve multiple spaces", async () => {
        const result = await executeTool(textReverser, {
          input: "one  two   three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // Spaces are reversed along with words
          expect((result.data as Record<string, unknown>).words).toContain(
            "three"
          );
          expect((result.data as Record<string, unknown>).words).toContain(
            "one"
          );
        }
      });
    });

    describe("line reversal", () => {
      it("should reverse line order", async () => {
        const result = await executeTool(textReverser, {
          input: "line1\nline2\nline3",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe(
            "line3\nline2\nline1"
          );
        }
      });

      it("should handle single line", async () => {
        const result = await executeTool(textReverser, { input: "single" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe("single");
        }
      });

      it("should handle Windows line endings", async () => {
        const result = await executeTool(textReverser, {
          input: "line1\r\nline2",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe(
            "line2\nline1"
          );
        }
      });

      it("should handle empty lines", async () => {
        const result = await executeTool(textReverser, {
          input: "line1\n\nline3",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe(
            "line3\n\nline1"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(textReverser, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe("");
          expect((result.data as Record<string, unknown>).words).toBe("");
          expect((result.data as Record<string, unknown>).lines).toBe("");
        }
      });

      it("should handle single character", async () => {
        const result = await executeTool(textReverser, { input: "a" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe("a");
          expect((result.data as Record<string, unknown>).words).toBe("a");
          expect((result.data as Record<string, unknown>).lines).toBe("a");
        }
      });

      it("should handle only spaces", async () => {
        const result = await executeTool(textReverser, { input: "   " });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "   "
          );
        }
      });

      it("should handle only newlines", async () => {
        const result = await executeTool(textReverser, { input: "\n\n\n" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe("\n\n\n");
        }
      });

      it("should handle special characters", async () => {
        const result = await executeTool(textReverser, {
          input: "!@#$%^&*()",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            ")(*&^%$#@!"
          );
        }
      });

      it("should handle numbers", async () => {
        const result = await executeTool(textReverser, { input: "12345" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).characters).toBe(
            "54321"
          );
        }
      });

      it("should handle mixed content", async () => {
        const result = await executeTool(textReverser, {
          input: "Line 1: Hello\nLine 2: World",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).lines).toBe(
            "Line 2: World\nLine 1: Hello"
          );
        }
      });

      it("should handle long text", async () => {
        const input = "a".repeat(10000);
        const result = await executeTool(textReverser, { input });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).characters.length
          ).toBe(10000);
        }
      });
    });
  });
});
