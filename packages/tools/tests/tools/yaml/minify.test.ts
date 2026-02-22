import { describe, it, expect } from "vitest";
import { yamlMinify } from "../../../src/tools/yaml/minify";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface MinifyOutput {
  output: string;
  originalSize: number;
  minifiedSize: number;
  reduction: number;
}

describe("yamlMinify", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlMinify.meta.id).toBe("yaml/minify");
    });

    it("should have correct name", () => {
      expect(yamlMinify.meta.name).toBe("YAML Minify");
    });

    it("should be in yaml category", () => {
      expect(yamlMinify.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlMinify.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlMinify.meta.keywords).toContain("yaml");
      expect(yamlMinify.meta.keywords).toContain("minify");
      expect(yamlMinify.meta.keywords).toContain("compact");
    });
  });

  describe("execute - basic minification", () => {
    it("should minify simple YAML", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toBeDefined();
        // Flow style output may or may not be smaller depending on content
        expect(data.minifiedSize).toBeGreaterThan(0);
      }
    });

    it("should use flow style for objects", async () => {
      const input = "user:\n  name: John\n  age: 30";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        // Flow style uses braces
        expect(data.output).toContain("{");
        expect(data.output).toContain("}");
      }
    });

    it("should use flow style for arrays", async () => {
      const input = "items:\n  - a\n  - b\n  - c";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        // Flow style uses brackets for arrays
        expect(data.output).toContain("[");
        expect(data.output).toContain("]");
      }
    });

    it("should minify deeply nested structures", async () => {
      const input = `
level1:
  level2:
    level3:
      value: deep
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toBeDefined();
        expect(data.minifiedSize).toBeLessThan(data.originalSize);
      }
    });
  });

  describe("execute - size metrics", () => {
    it("should return correct original size", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.originalSize).toBe(new Blob([input]).size);
      }
    });

    it("should return minified size", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        const actualMinifiedSize = new Blob([data.output]).size;
        expect(data.minifiedSize).toBe(actualMinifiedSize);
      }
    });

    it("should calculate reduction percentage", async () => {
      const input = `
user:
  name: John
  address:
    city: NYC
    country: USA
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.reduction).toBeGreaterThanOrEqual(0);
        expect(data.reduction).toBeLessThanOrEqual(100);
      }
    });

    it("should handle already minimal YAML", async () => {
      const input = "a: 1";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        // Flow style output is defined regardless of size
        expect(data.output).toBeDefined();
        expect(data.reduction).toBeDefined();
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty input", async () => {
      const result = await executeTool(yamlMinify, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        // Empty YAML parses to null, output is defined
        expect(data.output).toBeDefined();
        expect(data.originalSize).toBe(0);
      }
    });

    it("should handle null value", async () => {
      const result = await executeTool(yamlMinify, { input: "value: null" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toContain("null");
      }
    });

    it("should handle boolean values", async () => {
      const result = await executeTool(yamlMinify, {
        input: "enabled: true\ndisabled: false",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toContain("true");
        expect(data.output).toContain("false");
      }
    });

    it("should handle numeric values", async () => {
      const result = await executeTool(yamlMinify, {
        input: "int: 42\nfloat: 3.14",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toContain("42");
        expect(data.output).toContain("3.14");
      }
    });

    it("should handle string values with special characters", async () => {
      const result = await executeTool(yamlMinify, {
        input: 'message: "Hello: World!"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toContain("Hello");
      }
    });

    it("should handle arrays of objects", async () => {
      const input = `
users:
  - name: John
    age: 30
  - name: Jane
    age: 25
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toBeDefined();
      }
    });

    it("should handle mixed content", async () => {
      const input = `
config:
  enabled: true
  items:
    - one
    - two
  settings:
    timeout: 30
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toBeDefined();
        expect(data.minifiedSize).toBeLessThan(data.originalSize);
      }
    });

    it("should strip comments during minification", async () => {
      const input = `
# This is a comment
name: test
# Another comment
value: 123
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).not.toContain("#");
        expect(data.output).not.toContain("comment");
      }
    });
  });

  describe("execute - significant reduction", () => {
    it("should significantly reduce large formatted YAML", async () => {
      const input = `
server:
  host: localhost
  port: 3000
  options:
    timeout: 5000
    retries: 3
database:
  url: mongodb://localhost:27017
  name: myapp
  options:
    poolSize: 10
    useNewUrlParser: true
features:
  - authentication
  - logging
  - caching
  - monitoring
`;
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        // Should have some reduction for formatted YAML
        expect(data.reduction).toBeGreaterThan(0);
        expect(data.minifiedSize).toBeLessThan(data.originalSize);
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML syntax", async () => {
      const result = await executeTool(yamlMinify, {
        input: "invalid: yaml: syntax:",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid YAML");
      }
    });

    it("should return error for malformed indentation", async () => {
      const result = await executeTool(yamlMinify, {
        input: "key:\n  subkey: value\n wrong: indent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for unbalanced brackets", async () => {
      const result = await executeTool(yamlMinify, {
        input: "list: [item1, item2",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute - output format", () => {
    it("should output trimmed result", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output).toBe(data.output.trim());
      }
    });

    it("should not have trailing newlines", async () => {
      const input = "name: test\nvalue: 123";
      const result = await executeTool(yamlMinify, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MinifyOutput;
        expect(data.output.endsWith("\n")).toBe(false);
      }
    });
  });

  describe("execute function directly", () => {
    it("should work with direct function call", () => {
      const result = yamlMinify.execute({ input: "name: test\nvalue: 123" });
      expect(result.output).toBeDefined();
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.minifiedSize).toBeGreaterThan(0);
    });

    it("should calculate reduction correctly", () => {
      const input = `
user:
  name: John
  age: 30
`;
      const result = yamlMinify.execute({ input });
      const expectedReduction = Math.round(
        ((result.originalSize - result.minifiedSize) / result.originalSize) *
          100
      );
      expect(result.reduction).toBe(expectedReduction);
    });

    it("should handle error cases gracefully", () => {
      // Test that the tool handles non-parseable YAML properly
      expect(() =>
        yamlMinify.execute({ input: "invalid: yaml: syntax:" })
      ).toThrow();
    });
  });
});
