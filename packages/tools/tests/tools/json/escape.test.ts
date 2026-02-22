import { describe, it, expect } from "vitest";
import { jsonEscape } from "../../../src/tools/json/escape";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface EscapeOutput {
  output: string;
  withQuotes: string;
}

describe("jsonEscape", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonEscape.meta.id).toBe("json/escape");
      expect(jsonEscape.meta.name).toBe("JSON Escape");
      expect(jsonEscape.meta.category).toBe("json");
      expect(jsonEscape.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonEscape.meta.keywords).toContain("json");
      expect(jsonEscape.meta.keywords).toContain("escape");
    });
  });

  describe("execute", () => {
    describe("basic escaping", () => {
      it("should escape double quotes", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: 'Hello "World"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            'Hello \\"World\\"'
          );
          expect((result.data as Record<string, unknown>).withQuotes).toBe(
            '"Hello \\"World\\""'
          );
        }
      });

      it("should escape backslashes", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "C:\\path\\to\\file",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "C:\\\\path\\\\to\\\\file"
          );
        }
      });

      it("should escape newlines", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "line1\nline2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\\nline2"
          );
        }
      });

      it("should escape tabs", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "col1\tcol2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "col1\\tcol2"
          );
        }
      });

      it("should escape carriage returns", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "line1\rline2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\\rline2"
          );
        }
      });

      it("should escape form feeds", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "page1\fpage2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "page1\\fpage2"
          );
        }
      });

      it("should escape backspace", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "text\bmore",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "text\\bmore"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).withQuotes).toBe(
            '""'
          );
        }
      });

      it("should handle string with no special characters", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "Hello World",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello World"
          );
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "Hello",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Unicode emoji should be preserved or escaped
          expect(
            (result.data as Record<string, unknown>).withQuotes
          ).toBeDefined();
        }
      });

      it("should handle multiple special characters combined", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: '"Hello"\n\t\\World',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '\\"Hello\\"\\n\\t\\\\World'
          );
        }
      });

      it("should handle very long strings", async () => {
        const longString = "a".repeat(10000);
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: longString,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            longString
          );
        }
      });

      it("should handle control characters", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "text\u0000\u001fmore",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Control characters should be escaped to \uXXXX format
          expect((result.data as Record<string, unknown>).output).toContain(
            "\\u"
          );
        }
      });
    });

    describe("withQuotes output", () => {
      it("should provide properly quoted string", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: "test",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).withQuotes).toBe(
            '"test"'
          );
          // Verify it's valid JSON
          expect(() => {
            JSON.parse((result.data as Record<string, unknown>).withQuotes);
          }).not.toThrow();
        }
      });

      it("should provide valid JSON for complex strings", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: 'Hello "World"\nNew line',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // withQuotes should be valid JSON
          expect(() => {
            JSON.parse((result.data as Record<string, unknown>).withQuotes);
          }).not.toThrow();
          expect(
            JSON.parse(
              (result.data as Record<string, unknown>).withQuotes
            ) as string
          ).toBe('Hello "World"\nNew line');
        }
      });
    });

    describe("error handling", () => {
      it("should return error for missing input", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });

      it("should return error for non-string input", async () => {
        const result = await executeTool<EscapeOutput>(jsonEscape, {
          input: 123,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
