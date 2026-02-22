import { describe, it, expect } from "vitest";
import { textTrimmer } from "../../../src/tools/text/text-trimmer";
import { executeTool } from "../../../src/core/executor";

describe("textTrimmer", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(textTrimmer.meta.id).toBe("text/trimmer");
      expect(textTrimmer.meta.name).toBe("Text Trimmer");
      expect(textTrimmer.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("default trimming", () => {
      it("should trim both sides by default", async () => {
        const result = await executeTool(textTrimmer, {
          input: "  hello world  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello world"
          );
        }
      });

      it("should count trimmed characters", async () => {
        const result = await executeTool(textTrimmer, {
          input: "   hello   ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).trimmedStart).toBe(3);
          expect((result.data as Record<string, unknown>).trimmedEnd).toBe(3);
          expect((result.data as Record<string, unknown>).totalTrimmed).toBe(6);
        }
      });
    });

    describe("trim modes", () => {
      it("should trim only start", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "   hello   " },
          { mode: "start" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello   "
          );
          expect((result.data as Record<string, unknown>).trimmedStart).toBe(3);
          expect((result.data as Record<string, unknown>).trimmedEnd).toBe(0);
        }
      });

      it("should trim only end", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "   hello   " },
          { mode: "end" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "   hello"
          );
          expect((result.data as Record<string, unknown>).trimmedStart).toBe(0);
          expect((result.data as Record<string, unknown>).trimmedEnd).toBe(3);
        }
      });

      it("should trim both sides", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "   hello   " },
          { mode: "both" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });
    });

    describe("per-line trimming", () => {
      it("should trim each line individually", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "  line1  \n  line2  " },
          { perLine: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2"
          );
        }
      });

      it("should respect mode when trimming per line", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "  line1  \n  line2  " },
          { perLine: true, mode: "start" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1  \nline2  "
          );
        }
      });

      it("should count total trimmed across all lines", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "  a  \n  b  " },
          { perLine: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).totalTrimmed).toBe(8); // 2+2 from each line
        }
      });
    });

    describe("custom characters", () => {
      it("should trim specific characters", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "xxxhelloxxx" },
          { characters: "x" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should trim multiple custom characters", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "---hello===" },
          { characters: "-=" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should respect mode with custom characters", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "xxxhelloxxx" },
          { characters: "x", mode: "start" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "helloxxx"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(textTrimmer, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).totalTrimmed).toBe(0);
        }
      });

      it("should handle only whitespace", async () => {
        const result = await executeTool(textTrimmer, { input: "    " });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          // Total trimmed counts both start and end trimming
          expect(
            (result.data as Record<string, unknown>).totalTrimmed
          ).toBeGreaterThanOrEqual(4);
        }
      });

      it("should handle no whitespace to trim", async () => {
        const result = await executeTool(textTrimmer, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
          expect((result.data as Record<string, unknown>).totalTrimmed).toBe(0);
        }
      });

      it("should handle tabs and newlines", async () => {
        const result = await executeTool(textTrimmer, {
          input: "\t\nhello\t\n",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should handle Windows line endings", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "  line1  \r\n  line2  " },
          { perLine: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2"
          );
        }
      });

      it("should handle unicode whitespace", async () => {
        const result = await executeTool(textTrimmer, {
          input: "  hello  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeLessThan(9);
        }
      });

      it("should handle long text", async () => {
        const longText = "   " + "a".repeat(10000) + "   ";
        const result = await executeTool(textTrimmer, { input: longText });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output.length).toBe(
            10000
          );
          expect((result.data as Record<string, unknown>).totalTrimmed).toBe(6);
        }
      });

      it("should handle empty lines in per-line mode", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "  line1  \n\n  line2  " },
          { perLine: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\n\nline2"
          );
        }
      });

      it("should count correctly with custom chars at start only", async () => {
        const result = await executeTool(
          textTrimmer,
          { input: "xxxhello" },
          { characters: "x", mode: "both" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).trimmedStart).toBe(3);
          expect((result.data as Record<string, unknown>).trimmedEnd).toBe(0);
        }
      });
    });
  });
});
