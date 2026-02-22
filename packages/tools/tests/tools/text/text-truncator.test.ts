import { describe, it, expect } from "vitest";
import { textTruncator } from "../../../src/tools/text/text-truncator";
import { executeTool } from "../../../src/core/executor";

describe("textTruncator", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textTruncator.meta.id).toBe("text/truncator");
      expect(textTruncator.meta.name).toBe("Text Truncator");
      expect(textTruncator.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic truncation", () => {
      it("should truncate long text", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "This is a very long sentence that needs to be truncated" },
          { maxLength: 20 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(20);
          expect((result.data as Record<string, unknown>).truncated).toBe(true);
        }
      });

      it("should not truncate short text", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Short text" },
          { maxLength: 100 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Short text"
          );
          expect((result.data as Record<string, unknown>).truncated).toBe(
            false
          );
        }
      });

      it("should add suffix by default", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "This is a long text that will be truncated" },
          { maxLength: 20 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "..."
          );
        }
      });

      it("should return correct length information", async () => {
        const input = "Hello World";
        const result = await executeTool(textTruncator, { input });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).originalLength).toBe(
            11
          );
        }
      });
    });

    describe("suffix options", () => {
      it("should use custom suffix", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "This is a long text" },
          { maxLength: 15, suffix: "---" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "---"
          );
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "..."
          );
        }
      });

      it("should handle empty suffix", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello World Test" },
          { maxLength: 10, suffix: "" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(10);
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "..."
          );
        }
      });
    });

    describe("word preservation", () => {
      it("should preserve word boundaries by default", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello wonderful world" },
          { maxLength: 15 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Should not cut "wonderful" in the middle
          expect((result.data as Record<string, unknown>).output).not.toMatch(
            /wonderf\.\.\./
          );
        }
      });

      it("should allow breaking words when disabled", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello wonderful world" },
          { maxLength: 15, preserveWords: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(15);
        }
      });
    });

    describe("truncation position", () => {
      it("should truncate at end by default", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Start middle end of text" },
          { maxLength: 15 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toMatch(
            /^Start/
          );
          expect((result.data as Record<string, unknown>).output).toMatch(
            /\.\.\.$/
          );
        }
      });

      it("should truncate at start", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Start middle end of text" },
          { maxLength: 15, position: "start" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toMatch(
            /^\.\.\./
          );
        }
      });

      it("should truncate at middle", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Start middle end" },
          { maxLength: 12, position: "middle" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "..."
          );
          expect((result.data as Record<string, unknown>).truncated).toBe(true);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "" },
          { maxLength: 10 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).truncated).toBe(
            false
          );
          expect((result.data as Record<string, unknown>).originalLength).toBe(
            0
          );
        }
      });

      it("should handle maxLength equal to text length", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello" },
          { maxLength: 5 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("Hello");
          expect((result.data as Record<string, unknown>).truncated).toBe(
            false
          );
        }
      });

      it("should handle maxLength smaller than suffix", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello World" },
          { maxLength: 2, suffix: "..." }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Should truncate suffix itself
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(2);
        }
      });

      it("should handle single word longer than maxLength", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "supercalifragilisticexpialidocious" },
          { maxLength: 10 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(10);
          expect((result.data as Record<string, unknown>).truncated).toBe(true);
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "Hello world test" },
          { maxLength: 10 }
        );
        expect(result.success).toBe(true);
      });

      it("should return correct result length", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "This is a test" },
          { maxLength: 10 }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).resultLength).toBe(
            (result.data as Record<string, unknown>).output.length
          );
        }
      });

      it("should handle text with only spaces", async () => {
        const result = await executeTool(
          textTruncator,
          { input: "          " },
          { maxLength: 5 }
        );
        expect(result.success).toBe(true);
      });

      it("should work with default maxLength", async () => {
        const shortText = "Short";
        const result = await executeTool(textTruncator, { input: shortText });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).truncated).toBe(
            false
          );
        }
      });

      it("should work with long text and defaults", async () => {
        const longText = "a ".repeat(100);
        const result = await executeTool(textTruncator, { input: longText });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThanOrEqual(100);
        }
      });
    });
  });
});
