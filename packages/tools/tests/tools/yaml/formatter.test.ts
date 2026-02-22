import { describe, it, expect } from "vitest";
import { yamlFormatter } from "../../../src/tools/yaml/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface FormatterOutput {
  output: string;
}

describe("yamlFormatter", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlFormatter.meta.id).toBe("yaml/formatter");
    });

    it("should have correct name", () => {
      expect(yamlFormatter.meta.name).toBe("YAML Formatter");
    });

    it("should be in yaml category", () => {
      expect(yamlFormatter.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlFormatter.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlFormatter.meta.keywords).toContain("yaml");
      expect(yamlFormatter.meta.keywords).toContain("format");
      expect(yamlFormatter.meta.keywords).toContain("prettify");
    });
  });

  describe("execute - basic formatting", () => {
    it("should format simple YAML with default 2-space indent", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "name: test\nvalue: 123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("name: test");
        expect(data.output).toContain("value: 123");
      }
    });

    it("should format nested objects", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "user:\n  name: John\n  age: 30",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("user:");
        expect(data.output).toContain("  name: John");
        expect(data.output).toContain("  age: 30");
      }
    });

    it("should format arrays", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "items:\n  - one\n  - two\n  - three",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("items:");
        expect(data.output).toContain("- one");
        expect(data.output).toContain("- two");
        expect(data.output).toContain("- three");
      }
    });

    it("should format deeply nested structures", async () => {
      const input = `
level1:
  level2:
    level3:
      value: deep
`;
      const result = await executeTool(yamlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("level1:");
        expect(data.output).toContain("level2:");
        expect(data.output).toContain("level3:");
        expect(data.output).toContain("value: deep");
      }
    });
  });

  describe("execute - options", () => {
    it("should respect custom indent option", async () => {
      const result = await executeTool(
        yamlFormatter,
        { input: "parent:\n  child: value" },
        { indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("    child: value");
      }
    });

    it("should sort keys when sortKeys option is true", async () => {
      const result = await executeTool(
        yamlFormatter,
        { input: "zebra: 1\nalpha: 2\nmiddle: 3" },
        { sortKeys: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        const lines = data.output.trim().split("\n");
        expect(lines[0]).toContain("alpha:");
        expect(lines[1]).toContain("middle:");
        expect(lines[2]).toContain("zebra:");
      }
    });

    it("should preserve key order when sortKeys is false", async () => {
      const result = await executeTool(
        yamlFormatter,
        { input: "zebra: 1\nalpha: 2\nmiddle: 3" },
        { sortKeys: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        const lines = data.output.trim().split("\n");
        expect(lines[0]).toContain("zebra:");
        expect(lines[1]).toContain("alpha:");
        expect(lines[2]).toContain("middle:");
      }
    });

    it("should use flow style when flowLevel is set", async () => {
      const result = await executeTool(
        yamlFormatter,
        { input: "items:\n  - a\n  - b\n  - c" },
        { flowLevel: 1 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        // Flow style should produce inline arrays/objects
        expect(data.output).toContain("[");
      }
    });

    it("should respect lineWidth option for long values", async () => {
      const longValue = "a".repeat(100);
      const result = await executeTool(
        yamlFormatter,
        { input: `text: ${longValue}` },
        { lineWidth: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        // Line should be wrapped or handled according to lineWidth
        expect(data.output).toBeDefined();
      }
    });

    it("should combine multiple options", async () => {
      const result = await executeTool(
        yamlFormatter,
        { input: "b: 1\na:\n  nested: value" },
        { indent: 4, sortKeys: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        const output = data.output;
        // Should be sorted
        expect(output.indexOf("a:")).toBeLessThan(output.indexOf("b:"));
        // Should have 4-space indent
        expect(output).toContain("    nested:");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty input", async () => {
      const result = await executeTool(yamlFormatter, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        // Empty input parses to null, which formats as empty string or null
        expect(data.output).toBeDefined();
      }
    });

    it("should handle null values", async () => {
      const result = await executeTool(yamlFormatter, { input: "value: null" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("null");
      }
    });

    it("should handle boolean values", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "enabled: true\ndisabled: false",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("true");
        expect(data.output).toContain("false");
      }
    });

    it("should handle numeric values", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "integer: 42\nfloat: 3.14\nnegative: -10",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("42");
        expect(data.output).toContain("3.14");
        expect(data.output).toContain("-10");
      }
    });

    it("should handle special characters in strings", async () => {
      const result = await executeTool(yamlFormatter, {
        input: 'message: "Hello: World!"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("Hello: World!");
      }
    });

    it("should handle multiline strings", async () => {
      const result = await executeTool(yamlFormatter, {
        input: 'description: "Line 1\\nLine 2\\nLine 3"',
      });

      expect(result.success).toBe(true);
    });

    it("should handle already formatted YAML", async () => {
      const formatted = "name: test\nvalue: 123\n";
      const result = await executeTool(yamlFormatter, { input: formatted });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("name: test");
        expect(data.output).toContain("value: 123");
      }
    });

    it("should handle YAML with comments (comments are stripped)", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "# This is a comment\nname: test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("name: test");
      }
    });
  });

  describe("execute - complex structures", () => {
    it("should format mixed nested arrays and objects", async () => {
      const input = `
users:
  - name: John
    roles:
      - admin
      - user
  - name: Jane
    roles:
      - user
`;
      const result = await executeTool(yamlFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("users:");
        expect(data.output).toContain("name: John");
        expect(data.output).toContain("- admin");
      }
    });

    it("should handle array of primitives", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "numbers:\n  - 1\n  - 2\n  - 3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as FormatterOutput;
        expect(data.output).toContain("- 1");
        expect(data.output).toContain("- 2");
        expect(data.output).toContain("- 3");
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML syntax", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "invalid: yaml: syntax:",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid YAML");
      }
    });

    it("should return error for malformed indentation", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "key:\n  subkey: value\n wrong: indent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for unbalanced brackets", async () => {
      const result = await executeTool(yamlFormatter, {
        input: "list: [item1, item2",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = yamlFormatter.execute({ input: "name: test" }, undefined);
      expect(result.output).toContain("name: test");
    });

    it("should use default indent of 2 when not specified", () => {
      const result = yamlFormatter.execute(
        { input: "parent:\n  child: value" },
        undefined
      );
      expect(result.output).toContain("  child:");
    });

    it("should handle error cases gracefully", () => {
      // Test that the tool handles non-parseable YAML properly
      expect(() =>
        yamlFormatter.execute({ input: "invalid: yaml: syntax:" }, undefined)
      ).toThrow();
    });
  });
});
