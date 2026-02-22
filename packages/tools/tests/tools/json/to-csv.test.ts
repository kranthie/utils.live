import { describe, it, expect } from "vitest";
import { jsonToCsv } from "../../../src/tools/json/to-csv";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToCsvOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("jsonToCsv", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonToCsv.meta.id).toBe("json/to-csv");
      expect(jsonToCsv.meta.name).toBe("JSON to CSV");
      expect(jsonToCsv.meta.category).toBe("json");
      expect(jsonToCsv.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonToCsv.meta.keywords).toContain("json");
      expect(jsonToCsv.meta.keywords).toContain("csv");
    });
  });

  describe("execute", () => {
    describe("basic conversion", () => {
      it("should convert array of objects to CSV", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "name"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "age"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "Jane"
          );
          expect((result.data as Record<string, unknown>).rowCount).toBe(2);
          expect((result.data as Record<string, unknown>).columnCount).toBe(2);
        }
      });

      it("should handle single object array", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"name": "John", "age": 30}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).rowCount).toBe(1);
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).rowCount).toBe(0);
          expect((result.data as Record<string, unknown>).columnCount).toBe(0);
        }
      });
    });

    describe("nested objects", () => {
      it("should flatten nested objects", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"user": {"name": "John", "age": 30}}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "user.name"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "user.age"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
        }
      });

      it("should handle deeply nested objects", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"a": {"b": {"c": "value"}}}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "a.b.c"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "value"
          );
        }
      });

      it("should serialize arrays as JSON strings", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"tags": ["a", "b", "c"]}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Arrays should be JSON stringified
          expect((result.data as Record<string, unknown>).output).toContain(
            "["
          );
        }
      });
    });

    describe("delimiter option", () => {
      it("should use comma delimiter by default", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"a": 1, "b": 2}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            ","
          );
        }
      });

      it("should use custom delimiter", async () => {
        const result = await executeTool<ToCsvOutput>(
          jsonToCsv,
          { input: '[{"a": 1, "b": 2}]' },
          { delimiter: ";" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            ";"
          );
        }
      });

      it("should use tab delimiter", async () => {
        const result = await executeTool<ToCsvOutput>(
          jsonToCsv,
          { input: '[{"a": 1, "b": 2}]' },
          { delimiter: "\t" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\t"
          );
        }
      });
    });

    describe("header option", () => {
      it("should include header by default", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"name": "John"}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n");
          expect(lines[0]).toContain("name");
        }
      });

      it("should exclude header when option is false", async () => {
        const result = await executeTool<ToCsvOutput>(
          jsonToCsv,
          { input: '[{"name": "John"}]' },
          { header: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const lines = (
            (result.data as Record<string, unknown>).output as string
          )
            .split("\n")
            .filter((l: string) => l);
          expect(lines.length).toBe(1);
          expect(lines[0]).toContain("John");
        }
      });
    });

    describe("quotes option", () => {
      it("should quote fields by default", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"name": "John"}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            '"'
          );
        }
      });

      it("should not quote when option is false", async () => {
        const result = await executeTool<ToCsvOutput>(
          jsonToCsv,
          { input: '[{"name": "John"}]' },
          { quotes: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // Fields without special characters should not be quoted
          const dataLine = (
            (result.data as Record<string, unknown>).output as string
          ).split("\n")[1];
          if (dataLine) {
            // John should appear without quotes
            expect(dataLine).toContain("John");
          }
        }
      });
    });

    describe("newline option", () => {
      it("should use LF by default", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"a": 1}, {"a": 2}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\n"
          );
        }
      });

      it("should use CRLF when specified", async () => {
        const result = await executeTool<ToCsvOutput>(
          jsonToCsv,
          { input: '[{"a": 1}, {"a": 2}]' },
          { newline: "CRLF" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\r\n"
          );
        }
      });
    });

    describe("primitive values handling", () => {
      it("should wrap primitive array items", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: "[1, 2, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "value"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
        }
      });

      it("should handle mixed primitives", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '["hello", 123, true, null]',
        });

        expect(result.success).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle special characters in values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"text": "Hello, World!"}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Values with commas should be properly quoted
          expect((result.data as Record<string, unknown>).output).toContain(
            "Hello, World!"
          );
        }
      });

      it("should handle newlines in values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"text": "Line1\\nLine2"}]',
        });

        expect(result.success).toBe(true);
      });

      it("should handle quotes in values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"text": "He said \\"Hello\\""}]',
        });

        expect(result.success).toBe(true);
      });

      it("should handle null values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"name": "John", "middle": null}]',
        });

        expect(result.success).toBe(true);
      });

      it("should handle boolean values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"active": true, "verified": false}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "true"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "false"
          );
        }
      });

      it("should handle numeric values", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"int": 42, "float": 3.14}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "42"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "3.14"
          );
        }
      });

      it("should handle objects with different keys", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '[{"a": 1}, {"b": 2}, {"a": 3, "b": 4}]',
        });

        expect(result.success).toBe(true);
      });
    });

    describe("error handling", () => {
      it("should return error for non-array JSON", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: '{"name": "John"}',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_FORMAT");
        }
      });

      it("should return error for invalid JSON", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {
          input: "[invalid]",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<ToCsvOutput>(jsonToCsv, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
