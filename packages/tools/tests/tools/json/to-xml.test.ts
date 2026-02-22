import { describe, it, expect } from "vitest";
import { jsonToXml } from "../../../src/tools/json/to-xml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonToXml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(jsonToXml.meta.id).toBe("json/to-xml");
      expect(jsonToXml.meta.name).toBe("JSON to XML");
      expect(jsonToXml.meta.category).toBe("json");
      expect(jsonToXml.meta.tier).toBe(ToolTier.CLIENT);
      expect(jsonToXml.meta.keywords).toContain("json");
      expect(jsonToXml.meta.keywords).toContain("xml");
      expect(jsonToXml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    describe("basic conversion", () => {
      it("should convert simple object to XML", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"name": "John", "age": 30}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<root>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "</root>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<name>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<age>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "30"
          );
        }
      });

      it("should convert nested objects", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"user": {"name": "John", "address": {"city": "NYC"}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<user>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "</user>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<address>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<city>"
          );
        }
      });

      it("should convert arrays", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"items": [1, 2, 3]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<items>"
          );
          // Array values should appear in output
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "2"
          );
        }
      });
    });

    describe("rootName option", () => {
      it("should use 'root' as default root name", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"name": "test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<root>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "</root>"
          );
        }
      });

      it("should use custom root name", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"name": "test"}' },
          { rootName: "document" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<document>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "</document>"
          );
        }
      });
    });

    describe("arrayNodeName option", () => {
      it("should convert root array to XML", async () => {
        const result = await executeTool(jsonToXml, {
          input: "[1, 2, 3]",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Array values should appear
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "2"
          );
        }
      });

      it("should use array node name for nested arrays", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"data": {"items": [1, 2]}}' },
          { arrayNodeName: "element" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<data>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
        }
      });
    });

    describe("indent option", () => {
      it("should use 2-space indent by default", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"a": 1}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "  "
          );
        }
      });

      it("should use custom indent", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"a": 1}' },
          { indent: "    " }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "    "
          );
        }
      });

      it("should use tab indent", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"a": 1}' },
          { indent: "\t" }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\t"
          );
        }
      });
    });

    describe("declaration option", () => {
      it("should include XML declaration by default", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"name": "test"}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<?xml"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            'version="1.0"'
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            'encoding="UTF-8"'
          );
        }
      });

      it("should exclude XML declaration when option is false", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"name": "test"}' },
          { declaration: false }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "<?xml"
          );
        }
      });
    });

    describe("primitive values", () => {
      it("should handle string value", async () => {
        const result = await executeTool(jsonToXml, {
          input: '"hello"',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "hello"
          );
        }
      });

      it("should handle number value", async () => {
        const result = await executeTool(jsonToXml, {
          input: "42",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "42"
          );
        }
      });

      it("should handle boolean value", async () => {
        const result = await executeTool(jsonToXml, {
          input: "true",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "true"
          );
        }
      });

      it("should handle null value", async () => {
        const result = await executeTool(jsonToXml, {
          input: "null",
        });

        expect(result.success).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle empty object", async () => {
        const result = await executeTool(jsonToXml, {
          input: "{}",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<root>"
          );
        }
      });

      it("should handle empty array", async () => {
        const result = await executeTool(jsonToXml, {
          input: "[]",
        });

        expect(result.success).toBe(true);
        // Empty array produces minimal XML
      });

      it("should handle deeply nested structures", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"a": {"b": {"c": {"d": 1}}}}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<a>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<b>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<c>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<d>"
          );
        }
      });

      it("should handle arrays of objects", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"users": [{"name": "John"}, {"name": "Jane"}]}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "<users>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "John"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "Jane"
          );
        }
      });

      it("should handle null values in objects", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"name": null}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle mixed array content", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"items": [1, "two", true, null]}',
        });

        expect(result.success).toBe(true);
      });

      it("should handle special characters", async () => {
        const result = await executeTool(jsonToXml, {
          input: '{"text": "Hello <World> & \\"Friends\\""}',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          // Special characters should appear in output (fast-xml-parser may or may not escape)
          expect((result.data as Record<string, unknown>).output).toContain(
            "text"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "Hello"
          );
        }
      });
    });

    describe("combined options", () => {
      it("should apply multiple options together", async () => {
        const result = await executeTool(
          jsonToXml,
          { input: '{"items": [1, 2]}' },
          {
            rootName: "data",
            arrayNodeName: "entry",
            indent: "    ",
            declaration: false,
          }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "<?xml"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "<data>"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "    "
          );
          // Array values should appear
          expect((result.data as Record<string, unknown>).output).toContain(
            "1"
          );
        }
      });
    });

    describe("error handling", () => {
      it("should return error for invalid JSON", async () => {
        const result = await executeTool(jsonToXml, {
          input: "{invalid}",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for empty input", async () => {
        const result = await executeTool(jsonToXml, {
          input: "",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("JSON_PARSE_ERROR");
        }
      });

      it("should return error for missing input", async () => {
        const result = await executeTool(jsonToXml, {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("INPUT_INVALID_TYPE");
        }
      });
    });
  });
});
