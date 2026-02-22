import { describe, it, expect } from "vitest";
import { yamlToJson } from "../../../src/tools/yaml/to-json";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToJsonOutput {
  output: string;
}

describe("yamlToJson", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlToJson.meta.id).toBe("yaml/to-json");
    });

    it("should have correct name", () => {
      expect(yamlToJson.meta.name).toBe("YAML to JSON");
    });

    it("should be in yaml category", () => {
      expect(yamlToJson.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlToJson.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlToJson.meta.keywords).toContain("yaml");
      expect(yamlToJson.meta.keywords).toContain("json");
      expect(yamlToJson.meta.keywords).toContain("convert");
    });
  });

  describe("execute - basic conversion", () => {
    it("should convert simple YAML to JSON", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          name: string;
          value: number;
        };
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should convert nested YAML to JSON", async () => {
      const input = "user:\n  name: John\n  age: 30";
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          user: { name: string; age: number };
        };
        expect(parsed.user.name).toBe("John");
        expect(parsed.user.age).toBe(30);
      }
    });

    it("should convert array YAML to JSON", async () => {
      const input = "items:\n  - a\n  - b\n  - c";
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as { items: string[] };
        expect(parsed.items).toEqual(["a", "b", "c"]);
      }
    });

    it("should convert array of objects", async () => {
      const input =
        "users:\n  - name: John\n    age: 30\n  - name: Jane\n    age: 25";
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          users: Array<{ name: string; age: number }>;
        };
        expect(parsed.users).toHaveLength(2);
        expect(parsed.users[0]!.name).toBe("John");
        expect(parsed.users[1]!.name).toBe("Jane");
      }
    });
  });

  describe("execute - options", () => {
    it("should use default 2-space indent", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output).toContain("  ");
        const lines = data.output.split("\n");
        expect(lines[1]!.startsWith("  ")).toBe(true);
      }
    });

    it("should respect custom indent", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlToJson, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const lines = data.output.split("\n");
        expect(lines[1]!.startsWith("    ")).toBe(true);
      }
    });

    it("should use no indentation when indent is 0", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlToJson, { input }, { indent: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        // No indentation means single line
        expect(data.output).toBe('{"name":"test","value":123}');
      }
    });

    it("should sort keys when sortKeys is true", async () => {
      const input = "zebra: 1\nalpha: 2\nmiddle: 3";
      const result = await executeTool(
        yamlToJson,
        { input },
        { sortKeys: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as Record<string, number>;
        const keys = Object.keys(parsed);
        expect(keys[0]).toBe("alpha");
        expect(keys[1]).toBe("middle");
        expect(keys[2]).toBe("zebra");
      }
    });

    it("should preserve key order when sortKeys is false", async () => {
      const input = "zebra: 1\nalpha: 2\nmiddle: 3";
      const result = await executeTool(
        yamlToJson,
        { input },
        { sortKeys: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const output = data.output;
        const zebraIndex = output.indexOf("zebra");
        const alphaIndex = output.indexOf("alpha");
        expect(zebraIndex).toBeLessThan(alphaIndex);
      }
    });

    it("should recursively sort keys when sortKeys is true", async () => {
      const input = `
zebra: 1
alpha:
  z: 1
  a: 2
`;
      const result = await executeTool(
        yamlToJson,
        { input },
        { sortKeys: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          alpha: Record<string, number>;
          zebra: number;
        };
        const topKeys = Object.keys(parsed);
        expect(topKeys[0]).toBe("alpha");

        const nestedKeys = Object.keys(parsed.alpha);
        expect(nestedKeys[0]).toBe("a");
        expect(nestedKeys[1]).toBe("z");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty input", async () => {
      const result = await executeTool(yamlToJson, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        // Empty YAML parses to undefined, which stringifies to undefined (not a valid JSON string)
        // The actual behavior depends on implementation - it may return undefined or "null"
        // Just verify the operation succeeded
        expect(result.success).toBe(true);
      }
    });

    it("should handle null value", async () => {
      const result = await executeTool(yamlToJson, { input: "value: null" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as { value: null };
        expect(parsed.value).toBeNull();
      }
    });

    it("should handle boolean values", async () => {
      const result = await executeTool(yamlToJson, {
        input: "enabled: true\ndisabled: false",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          enabled: boolean;
          disabled: boolean;
        };
        expect(parsed.enabled).toBe(true);
        expect(parsed.disabled).toBe(false);
      }
    });

    it("should handle numeric values", async () => {
      const result = await executeTool(yamlToJson, {
        input: "int: 42\nfloat: 3.14\nnegative: -10",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          int: number;
          float: number;
          negative: number;
        };
        expect(parsed.int).toBe(42);
        expect(parsed.float).toBe(3.14);
        expect(parsed.negative).toBe(-10);
      }
    });

    it("should handle string values with special characters", async () => {
      const result = await executeTool(yamlToJson, {
        input: 'message: "Hello: World!"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as { message: string };
        expect(parsed.message).toBe("Hello: World!");
      }
    });

    it("should handle primitive YAML", async () => {
      // String
      let result = await executeTool(yamlToJson, { input: "hello" });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output.trim()).toBe('"hello"');
      }

      // Number
      result = await executeTool(yamlToJson, { input: "42" });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output.trim()).toBe("42");
      }

      // Boolean
      result = await executeTool(yamlToJson, { input: "true" });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output.trim()).toBe("true");
      }
    });

    it("should handle empty object", async () => {
      const result = await executeTool(yamlToJson, { input: "{}" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output).toBe("{}");
      }
    });

    it("should handle empty array", async () => {
      const result = await executeTool(yamlToJson, { input: "[]" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        expect(data.output).toBe("[]");
      }
    });

    it("should handle deeply nested structures", async () => {
      const input = `
level1:
  level2:
    level3:
      level4:
        value: deep
`;
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          level1: { level2: { level3: { level4: { value: string } } } };
        };
        expect(parsed.level1.level2.level3.level4.value).toBe("deep");
      }
    });

    it("should handle multiline strings", async () => {
      const input = `
description: |
  Line 1
  Line 2
  Line 3
`;
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as { description: string };
        expect(parsed.description).toContain("Line 1");
        expect(parsed.description).toContain("Line 2");
        expect(parsed.description).toContain("Line 3");
      }
    });

    it("should handle flow style YAML", async () => {
      const result = await executeTool(yamlToJson, {
        input: "items: [1, 2, 3]\nconfig: {enabled: true}",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          items: number[];
          config: { enabled: boolean };
        };
        expect(parsed.items).toEqual([1, 2, 3]);
        expect(parsed.config.enabled).toBe(true);
      }
    });
  });

  describe("execute - complex structures", () => {
    it("should convert config-like YAML", async () => {
      const input = `
server:
  host: localhost
  port: 3000
database:
  url: mongodb://localhost
  options:
    poolSize: 10
features:
  - auth
  - logging
`;
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          server: { host: string; port: number };
          database: { url: string; options: { poolSize: number } };
          features: string[];
        };
        expect(parsed.server.host).toBe("localhost");
        expect(parsed.database.options.poolSize).toBe(10);
        expect(parsed.features).toContain("auth");
      }
    });

    it("should handle mixed arrays", async () => {
      const input = `
mixed:
  - string
  - 123
  - true
  - null
  - nested: value
`;
      const result = await executeTool(yamlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as {
          mixed: [string, number, boolean, null, { nested: string }];
        };
        expect(parsed.mixed[0]).toBe("string");
        expect(parsed.mixed[1]).toBe(123);
        expect(parsed.mixed[2]).toBe(true);
        expect(parsed.mixed[3]).toBeNull();
        expect(parsed.mixed[4].nested).toBe("value");
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML", async () => {
      const result = await executeTool(yamlToJson, {
        input: "invalid: yaml: syntax:",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid YAML");
      }
    });

    it("should return error for malformed indentation", async () => {
      const result = await executeTool(yamlToJson, {
        input: "key:\n  subkey: value\n wrong: indent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for unbalanced brackets", async () => {
      const result = await executeTool(yamlToJson, {
        input: "list: [1, 2, 3",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute - JSON validity", () => {
    it("should always produce valid JSON", async () => {
      const inputs = [
        "name: test",
        "items:\n  - a\n  - b",
        "nested:\n  deep:\n    value: true",
        'special: "quotes and : colons"',
      ];

      for (const input of inputs) {
        const result = await executeTool(yamlToJson, { input });
        expect(result.success).toBe(true);
        if (result.success) {
          const data = result.data as ToJsonOutput;
          expect(() => {
            JSON.parse(data.output);
          }).not.toThrow();
        }
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = yamlToJson.execute(
        { input: "name: test" },
        undefined
      ) as ToJsonOutput;
      const parsed = JSON.parse(result.output) as { name: string };
      expect(parsed.name).toBe("test");
    });

    it("should default to indent 2", () => {
      const result = yamlToJson.execute(
        { input: "name: test\nvalue: 123" },
        undefined
      ) as ToJsonOutput;
      const lines = result.output.split("\n");
      expect(lines[1]!.startsWith("  ")).toBe(true);
    });

    it("should default to sortKeys false", () => {
      const result = yamlToJson.execute(
        { input: "z: 1\na: 2" },
        undefined
      ) as ToJsonOutput;
      const zIndex = result.output.indexOf('"z"');
      const aIndex = result.output.indexOf('"a"');
      expect(zIndex).toBeLessThan(aIndex);
    });

    it("should handle error cases gracefully", () => {
      // Test that the tool handles non-parseable YAML properly
      expect(() =>
        yamlToJson.execute({ input: "invalid: yaml: syntax:" }, undefined)
      ).toThrow();
    });
  });
});
