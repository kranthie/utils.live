import { describe, it, expect } from "vitest";
import { jsonToYaml } from "../../../src/tools/json/to-yaml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToYamlOutput {
  output: string;
}

describe("jsonToYaml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonToYaml.meta.id).toBe("json/to-yaml");
      expect(jsonToYaml.meta.name).toBe("JSON to YAML");
      expect(jsonToYaml.meta.category).toBe("json");
      expect(jsonToYaml.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonToYaml.meta.keywords).toContain("json");
      expect(jsonToYaml.meta.keywords).toContain("yaml");
      expect(jsonToYaml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    describe("basic conversion", () => {
      it("should convert simple object to YAML", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"name": "John", "age": 30}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "name:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "age:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "30"
          );
        }
      });

      it("should convert nested objects", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "user:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "name:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "address:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "city:"
          );
        }
      });

      it("should convert arrays", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"items": [1, 2, 3]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "items:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "- 1"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "- 2"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "- 3"
          );
        }
      });

      it("should convert array of objects", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '[{"name": "John"}, {"name": "Jane"}]',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "- name: John"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "- name: Jane"
          );
        }
      });
    });

    describe("indent option", () => {
      it("should use 2-space indent by default", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"a": {"b": 1}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "  b:"
          );
        }
      });

      it("should use custom indent", async () => {
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: '{"a": {"b": 1}}' },
          { indent: 4 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    b:"
          );
        }
      });
    });

    describe("flowLevel option", () => {
      it("should use block style by default (flowLevel -1)", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"items": [1, 2, 3]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Block style uses newlines and dashes
          expect((result.data as Record<string, unknown>).output).toContain(
            "-"
          );
        }
      });

      it("should use flow style at level 0", async () => {
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: '{"items": [1, 2, 3]}' },
          { flowLevel: 0 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          // Flow style uses brackets
          expect((result.data as Record<string, unknown>).output).toContain(
            "{"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "}"
          );
        }
      });

      it("should use flow style for nested content", async () => {
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: '{"a": {"b": {"c": 1}}}' },
          { flowLevel: 2 }
        );

        expect(result.success).toBe(true);
      });
    });

    describe("sortKeys option", () => {
      it("should not sort keys by default", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"z": 1, "a": 2}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          const zIndex = (
            (result.data as Record<string, unknown>).output as string
          ).indexOf("z:");
          const aIndex = (
            (result.data as Record<string, unknown>).output as string
          ).indexOf("a:");
          expect(zIndex).toBeLessThan(aIndex);
        }
      });

      it("should sort keys when option is true", async () => {
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: '{"z": 1, "a": 2}' },
          { sortKeys: true }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          const zIndex = (
            (result.data as Record<string, unknown>).output as string
          ).indexOf("z:");
          const aIndex = (
            (result.data as Record<string, unknown>).output as string
          ).indexOf("a:");
          expect(aIndex).toBeLessThan(zIndex);
        }
      });
    });

    describe("lineWidth option", () => {
      it("should use 80 char line width by default", async () => {
        const longValue = "a".repeat(100);
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: JSON.stringify({ text: longValue }),
        });

        expect(result.success).toBe(true);
      });

      it("should use custom line width", async () => {
        const longValue = "a".repeat(100);
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: JSON.stringify({ text: longValue }) },
          { lineWidth: 200 }
        );

        expect(result.success).toBe(true);
      });
    });

    describe("primitive values", () => {
      it("should handle string value", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '"hello"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("hello");
        }
      });

      it("should handle number value", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "42",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("42");
        }
      });

      it("should handle boolean value", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "true",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("true");
        }
      });

      it("should handle null value", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "null",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("null");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("{}");
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            ((result.data as Record<string, unknown>).output as string).trim()
          ).toBe("[]");
        }
      });

      it("should handle deeply nested structures", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"a": {"b": {"c": {"d": 1}}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "a:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "b:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "c:"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "d:"
          );
        }
      });

      it("should handle mixed content", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input:
            '{"name": "test", "count": 42, "active": true, "data": null, "items": [1, 2]}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle special characters in strings", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"text": "Hello: World! #comment"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // YAML should properly quote strings with special characters
          expect((result.data as Record<string, unknown>).output).toContain(
            "text:"
          );
        }
      });

      it("should handle multiline strings", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"text": "line1\\nline2\\nline3"}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"emoji": "Hello"}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle keys with special characters", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: '{"key with spaces": "value", "key:colon": "value2"}',
        });

        expect(result.success).toBe(true);
      });
    });

    describe("combined options", () => {
      it("should apply multiple options together", async () => {
        const result = await executeTool<ToYamlOutput>(
          jsonToYaml,
          { input: '{"z": {"a": 1}}' },
          { indent: 4, sortKeys: true, lineWidth: 120 }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    a:"
          );
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty input", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {
          input: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool<ToYamlOutput>(jsonToYaml, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
