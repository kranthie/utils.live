import { describe, it, expect } from "vitest";
import { whitespaceCleaner } from "../../../src/tools/text/whitespace-cleaner";
import { executeTool } from "../../../src/core/executor";

describe("whitespaceCleaner", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(whitespaceCleaner.meta.id).toBe("text/whitespace-cleaner");
      expect(whitespaceCleaner.meta.name).toBe("Whitespace Cleaner");
      expect(whitespaceCleaner.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("space normalization", () => {
      it("should normalize multiple spaces to single", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "hello    world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello world"
          );
        }
      });

      it("should not normalize spaces when disabled", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "hello    world" },
          { normalizeSpaces: false, trimLines: false, trimDocument: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello    world"
          );
        }
      });
    });

    describe("tab conversion", () => {
      it("should convert tabs to spaces by default", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "hello\tworld",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\t"
          );
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).tabsConverted
          ).toBe(1);
        }
      });

      it("should use custom tab width", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "a\tb" },
          { tabWidth: 2, normalizeSpaces: false, trimLines: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("a  b");
        }
      });

      it("should not convert tabs when disabled", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "hello\tworld" },
          { convertTabs: false, trimLines: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\t"
          );
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).tabsConverted
          ).toBe(0);
        }
      });
    });

    describe("line trimming", () => {
      it("should trim lines by default", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "  line1  \n  line2  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2"
          );
        }
      });

      it("should not trim lines when disabled", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "  line1  " },
          { trimLines: false, trimDocument: false, normalizeSpaces: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "  line1  "
          );
        }
      });
    });

    describe("document trimming", () => {
      it("should trim document by default", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "\n\nhello\n\n",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should not trim document when disabled", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "\nhello\n" },
          { trimDocument: false, trimLines: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "\nhello\n"
          );
        }
      });
    });

    describe("line ending normalization", () => {
      it("should normalize CRLF to LF", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "line1\r\nline2",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\r\n"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "\n"
          );
        }
      });

      it("should normalize CR to LF", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "line1\rline2",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\r"
          );
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2"
          );
        }
      });

      it("should not normalize line endings when disabled", async () => {
        const result = await executeTool(
          whitespaceCleaner,
          { input: "line1\r\nline2" },
          { normalizeLineEndings: false, trimDocument: false, trimLines: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\r\n"
          );
        }
      });
    });

    describe("statistics", () => {
      it("should return original length", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "  hello  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).originalLength
          ).toBe(9);
        }
      });

      it("should return result length", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "  hello  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).resultLength
          ).toBe(5);
        }
      });

      it("should count tabs converted", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "\t\t\thello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).tabsConverted
          ).toBe(3);
        }
      });

      it("should calculate spaces removed", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "    hello    ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).spacesRemoved
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(whitespaceCleaner, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).originalLength
          ).toBe(0);
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).resultLength
          ).toBe(0);
        }
      });

      it("should handle only whitespace", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "   \t\n\r\n   ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
        }
      });

      it("should handle no whitespace to clean", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should handle mixed whitespace", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "  \t  hello  \t  world  \t  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello world"
          );
        }
      });

      it("should handle multiple lines with mixed issues", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "  line1  \r\n  line2  \n  line3  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2\nline3"
          );
        }
      });

      it("should handle long text", async () => {
        const longText = "  " + "word ".repeat(1000) + "  ";
        const result = await executeTool(whitespaceCleaner, {
          input: longText,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).resultLength
          ).toBeLessThan(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).originalLength
          );
        }
      });

      it("should ensure spacesRemoved is non-negative", async () => {
        const result = await executeTool(whitespaceCleaner, {
          input: "hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (
              (result.data as Record<string, unknown>).stats as Record<
                string,
                unknown
              >
            ).spacesRemoved
          ).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});
