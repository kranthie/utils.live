import { describe, it, expect } from "vitest";
import { jsonUnescape } from "../../../src/tools/json/unescape";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonUnescape", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonUnescape.meta.id).toBe("json/unescape");
      expect(jsonUnescape.meta.name).toBe("JSON Unescape");
      expect(jsonUnescape.meta.category).toBe("json");
      expect(jsonUnescape.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonUnescape.meta.keywords).toContain("json");
      expect(jsonUnescape.meta.keywords).toContain("unescape");
    });
  });

  describe("execute", () => {
    describe("basic unescaping", () => {
      it("should unescape double quotes", async () => {
        const result = await executeTool(jsonUnescape, {
          input: 'Hello \\"World\\"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            'Hello "World"'
          );
        }
      });

      it("should unescape backslashes", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "C:\\\\path\\\\to\\\\file",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "C:\\path\\to\\file"
          );
        }
      });

      it("should unescape newlines", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "line1\\nline2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\nline2"
          );
        }
      });

      it("should unescape tabs", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "col1\\tcol2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "col1\tcol2"
          );
        }
      });

      it("should unescape carriage returns", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "line1\\rline2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "line1\rline2"
          );
        }
      });

      it("should unescape form feeds", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "page1\\fpage2",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "page1\fpage2"
          );
        }
      });

      it("should unescape backspace", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "text\\bmore",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "text\bmore"
          );
        }
      });
    });

    describe("quoted input handling", () => {
      it("should handle double-quoted input", async () => {
        const result = await executeTool(jsonUnescape, {
          input: '"Hello \\"World\\""',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            'Hello "World"'
          );
        }
      });

      it("should handle single-quoted input", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "'Hello World'",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello World"
          );
        }
      });
    });

    describe("unicode escape sequences", () => {
      it("should unescape unicode sequences", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "\\u0048\\u0065\\u006c\\u006c\\u006f",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("Hello");
        }
      });

      it("should unescape unicode emoji", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "Hello \\u0048\\u0069",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello Hi"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", async () => {
        const result = await executeTool(jsonUnescape, {
          input: '""',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
        }
      });

      it("should handle string with no escape sequences", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "Hello World",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello World"
          );
        }
      });

      it("should handle multiple escape sequences", async () => {
        const result = await executeTool(jsonUnescape, {
          input: '\\"Hello\\"\\n\\t\\\\World',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '"Hello"\n\t\\World'
          );
        }
      });

      it("should handle already quoted JSON string", async () => {
        const result = await executeTool(jsonUnescape, {
          input: '"simple text"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "simple text"
          );
        }
      });
    });

    describe("roundtrip with escape", () => {
      it("should roundtrip with jsonEscape for basic strings", async () => {
        const original = 'Hello "World"';
        // Simulate escaping: "Hello \"World\""
        const escaped = 'Hello \\"World\\"';

        const result = await executeTool(jsonUnescape, {
          input: escaped,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            original
          );
        }
      });

      it("should roundtrip with special characters", async () => {
        const original = "line1\nline2\ttab";
        const escaped = "line1\\nline2\\ttab";

        const result = await executeTool(jsonUnescape, {
          input: escaped,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            original
          );
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid escape sequence", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "invalid \\x sequence",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for unclosed quote", async () => {
        const result = await executeTool(jsonUnescape, {
          input: '"unclosed',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool(jsonUnescape, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });

      it("should return error for invalid unicode escape", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "\\uXXXX",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for incomplete unicode escape", async () => {
        const result = await executeTool(jsonUnescape, {
          input: "\\u00",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });
    });
  });
});
