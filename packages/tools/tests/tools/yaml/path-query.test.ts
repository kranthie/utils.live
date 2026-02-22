import { describe, it, expect } from "vitest";
import { yamlPathQuery } from "../../../src/tools/yaml/path-query";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface PathQueryOutput {
  output: string;
  found: boolean;
  type: string;
}

describe("yamlPathQuery", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlPathQuery.meta.id).toBe("yaml/path-query");
    });

    it("should have correct name", () => {
      expect(yamlPathQuery.meta.name).toBe("YAML Path Query");
    });

    it("should be in yaml category", () => {
      expect(yamlPathQuery.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlPathQuery.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlPathQuery.meta.keywords).toContain("yaml");
      expect(yamlPathQuery.meta.keywords).toContain("path");
      expect(yamlPathQuery.meta.keywords).toContain("query");
    });
  });

  describe("execute - root query", () => {
    it("should return entire document for empty path", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlPathQuery, { input }, { query: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("object");
        expect(data.output).toContain("name: test");
      }
    });

    it("should return entire document for $ path", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(
        yamlPathQuery,
        { input },
        { query: "$" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output).toContain("name: test");
      }
    });
  });

  describe("execute - simple paths", () => {
    it("should query top-level key", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(
        yamlPathQuery,
        { input },
        { query: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("test");
        expect(data.type).toBe("string");
      }
    });

    it("should query numeric value", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("123");
        expect(data.type).toBe("number");
      }
    });

    it("should query boolean value", async () => {
      const input = "enabled: true";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "enabled" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("true");
        expect(data.type).toBe("boolean");
      }
    });
  });

  describe("execute - nested paths", () => {
    it("should query nested key with dot notation", async () => {
      const input = "user:\n  name: John\n  age: 30";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "user.name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("John");
      }
    });

    it("should query deeply nested key", async () => {
      const input = "level1:\n  level2:\n    level3:\n      value: deep";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "level1.level2.level3.value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("deep");
      }
    });

    it("should query nested object", async () => {
      const input = "user:\n  name: John\n  age: 30";
      const result = await executeTool(
        yamlPathQuery,
        { input },
        { query: "user" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("object");
        expect(data.output).toContain("name: John");
        expect(data.output).toContain("age: 30");
      }
    });
  });

  describe("execute - array paths", () => {
    it("should query array element by index", async () => {
      const input = "items:\n  - a\n  - b\n  - c";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "items[0]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("a");
      }
    });

    it("should query last array element", async () => {
      const input = "items:\n  - a\n  - b\n  - c";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "items[2]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("c");
      }
    });

    it("should query entire array", async () => {
      const input = "items:\n  - a\n  - b\n  - c";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "items" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("array");
        expect(data.output).toContain("- a");
        expect(data.output).toContain("- b");
        expect(data.output).toContain("- c");
      }
    });

    it("should query array of objects", async () => {
      const input =
        "users:\n  - name: John\n    age: 30\n  - name: Jane\n    age: 25";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "users[1].name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("Jane");
      }
    });
  });

  describe("execute - JSONPath notation", () => {
    it("should work with $ prefix", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "$.name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("test");
      }
    });

    it("should work with $.nested.path", async () => {
      const input = "user:\n  name: John";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "$.user.name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("John");
      }
    });

    it("should work with $[index]", async () => {
      const input = "- a\n- b\n- c";
      const result = await executeTool(
        yamlPathQuery,
        { input },
        { query: "$[1]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output.trim()).toBe("b");
      }
    });
  });

  describe("execute - bracket notation for keys", () => {
    it("should support bracket notation with quotes", async () => {
      const input = '"special-key": value';
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "['special-key']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
      }
    });

    it("should support bracket notation with double quotes", async () => {
      const input = '"my-key": myvalue';
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: '["my-key"]' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
      }
    });
  });

  describe("execute - not found cases", () => {
    it("should return not found for non-existent key", async () => {
      const input = "name: test";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "nonexistent" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
        expect(data.output).toBe("");
        expect(data.type).toBe("undefined");
      }
    });

    it("should return not found for non-existent nested key", async () => {
      const input = "user:\n  name: John";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "user.age" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
      }
    });

    it("should return not found for out-of-bounds array index", async () => {
      const input = "items:\n  - a\n  - b";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "items[10]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
      }
    });

    it("should return not found for negative array index", async () => {
      const input = "items:\n  - a\n  - b";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "items[-1]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
      }
    });

    it("should return not found when path traverses non-object", async () => {
      const input = "value: 123";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value.nested" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
      }
    });

    it("should return not found when indexing non-array", async () => {
      const input = "value: test";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value[0]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(false);
      }
    });
  });

  describe("execute - type detection", () => {
    it("should detect string type", async () => {
      const input = "value: hello";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("string");
      }
    });

    it("should detect number type", async () => {
      const input = "value: 42";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("number");
      }
    });

    it("should detect boolean type", async () => {
      const input = "value: true";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("boolean");
      }
    });

    it("should detect null type", async () => {
      const input = "value: null";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("null");
      }
    });

    it("should detect array type", async () => {
      const input = "value:\n  - a\n  - b";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("array");
      }
    });

    it("should detect object type", async () => {
      const input = "value:\n  key: val";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.type).toBe("object");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty object", async () => {
      const input = "empty: {}";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "empty" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("object");
      }
    });

    it("should handle empty array", async () => {
      const input = "empty: []";
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "empty" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("array");
      }
    });

    it("should handle root array", async () => {
      const input = "- a\n- b\n- c";
      const result = await executeTool(yamlPathQuery, { input }, { query: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.type).toBe("array");
      }
    });

    it("should handle special characters in values", async () => {
      const input = 'message: "Hello: World!"';
      const result = await executeTool(
        yamlPathQuery,
        {
          input,
        },
        { query: "message" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as PathQueryOutput;
        expect(data.found).toBe(true);
        expect(data.output).toContain("Hello: World!");
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML", async () => {
      const result = await executeTool(
        yamlPathQuery,
        {
          input: "invalid: yaml: syntax:",
        },
        { query: "invalid" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for malformed YAML", async () => {
      const result = await executeTool(
        yamlPathQuery,
        {
          input: "key:\n  subkey: value\n wrong: indent",
        },
        { query: "key" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute function directly", () => {
    it("should work with direct function call", () => {
      const result = yamlPathQuery.execute(
        {
          input: "name: test",
        },
        { query: "name" }
      ) as PathQueryOutput;
      expect(result.found).toBe(true);
      expect(result.output.trim()).toBe("test");
    });

    it("should return not found for missing path", () => {
      const result = yamlPathQuery.execute(
        {
          input: "name: test",
        },
        { query: "missing" }
      );
      expect(result.found).toBe(false);
      expect(result.output).toBe("");
    });
  });
});
