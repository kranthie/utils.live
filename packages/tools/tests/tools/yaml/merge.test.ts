import { describe, it, expect } from "vitest";
import { yamlMerge } from "../../../src/tools/yaml/merge";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface MergeOutput {
  output: string;
}

describe("yamlMerge", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlMerge.meta.id).toBe("yaml/merge");
    });

    it("should have correct name", () => {
      expect(yamlMerge.meta.name).toBe("YAML Merge");
    });

    it("should be in yaml category", () => {
      expect(yamlMerge.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlMerge.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlMerge.meta.keywords).toContain("yaml");
      expect(yamlMerge.meta.keywords).toContain("merge");
      expect(yamlMerge.meta.keywords).toContain("combine");
    });
  });

  describe("execute - deep merge (default)", () => {
    it("should merge simple objects", async () => {
      const yaml1 = "name: test";
      const yaml2 = "value: 123";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("name: test");
        expect(data.output).toContain("value: 123");
      }
    });

    it("should deeply merge nested objects", async () => {
      const yaml1 = `
user:
  name: John
  address:
    city: NYC
`;
      const yaml2 = `
user:
  age: 30
  address:
    country: USA
`;

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("name: John");
        expect(data.output).toContain("age: 30");
        expect(data.output).toContain("city: NYC");
        expect(data.output).toContain("country: USA");
      }
    });

    it("should overwrite values from second input", async () => {
      const yaml1 = "name: John";
      const yaml2 = "name: Jane";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("name: Jane");
        expect(data.output).not.toContain("name: John");
      }
    });
  });

  describe("execute - shallow merge", () => {
    it("should shallow merge objects", async () => {
      const yaml1 = `
user:
  name: John
  details:
    age: 30
`;
      const yaml2 = `
user:
  details:
    city: NYC
`;

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { strategy: "shallow" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        // In shallow merge, the entire user.details should be replaced
        expect(data.output).toContain("city: NYC");
        // age should not be preserved in shallow merge
        expect(data.output).not.toContain("age: 30");
      }
    });

    it("should completely replace top-level keys in shallow merge", async () => {
      const yaml1 = "config:\n  a: 1\n  b: 2";
      const yaml2 = "config:\n  c: 3";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { strategy: "shallow" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("c: 3");
        expect(data.output).not.toContain("a: 1");
        expect(data.output).not.toContain("b: 2");
      }
    });
  });

  describe("execute - array merge strategies", () => {
    it("should replace arrays by default", async () => {
      const yaml1 = "items:\n  - a\n  - b";
      const yaml2 = "items:\n  - c\n  - d";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("- c");
        expect(data.output).toContain("- d");
        expect(data.output).not.toContain("- a");
        expect(data.output).not.toContain("- b");
      }
    });

    it("should concat arrays when arrayMerge is concat", async () => {
      const yaml1 = "items:\n  - a\n  - b";
      const yaml2 = "items:\n  - c\n  - d";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { arrayMerge: "concat" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("- a");
        expect(data.output).toContain("- b");
        expect(data.output).toContain("- c");
        expect(data.output).toContain("- d");
      }
    });

    it("should create unique arrays when arrayMerge is unique", async () => {
      const yaml1 = "items:\n  - a\n  - b\n  - c";
      const yaml2 = "items:\n  - b\n  - c\n  - d";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { arrayMerge: "unique" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("- a");
        expect(data.output).toContain("- b");
        expect(data.output).toContain("- c");
        expect(data.output).toContain("- d");
        // Count occurrences - each should appear only once
        const matches = data.output.match(/- b/g);
        expect(matches?.length).toBe(1);
      }
    });

    it("should unique arrays of objects based on JSON stringify", async () => {
      const yaml1 = "items:\n  - id: 1\n  - id: 2";
      const yaml2 = "items:\n  - id: 2\n  - id: 3";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { arrayMerge: "unique" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("id: 1");
        expect(data.output).toContain("id: 3");
      }
    });
  });

  describe("execute - indent option", () => {
    it("should respect custom indent", async () => {
      const yaml1 = "parent:\n  child: value1";
      const yaml2 = "parent:\n  other: value2";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("    child:");
        expect(data.output).toContain("    other:");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty first input", async () => {
      const yaml1 = "";
      const yaml2 = "name: test";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("name: test");
      }
    });

    it("should handle empty second input", async () => {
      const yaml1 = "name: test";
      const yaml2 = "";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("name: test");
      }
    });

    it("should handle null values", async () => {
      const yaml1 = "value: null";
      const yaml2 = "other: test";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("other: test");
      }
    });

    it("should handle merging null with object", async () => {
      const yaml1 = "config: null";
      const yaml2 = "config:\n  enabled: true";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("enabled: true");
      }
    });

    it("should handle primitive values", async () => {
      const yaml1 = "42";
      const yaml2 = "name: test";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        // Second input replaces first when first is primitive
        expect(data.output).toContain("name: test");
      }
    });

    it("should handle boolean values", async () => {
      const yaml1 = "enabled: true";
      const yaml2 = "enabled: false";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("enabled: false");
      }
    });
  });

  describe("execute - complex merges", () => {
    it("should handle complex config-like merge", async () => {
      const yaml1 = `
server:
  host: localhost
  port: 3000
database:
  url: mongodb://localhost
  options:
    poolSize: 10
`;
      const yaml2 = `
server:
  port: 8080
  ssl: true
database:
  options:
    poolSize: 20
    timeout: 5000
`;

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("host: localhost");
        expect(data.output).toContain("port: 8080");
        expect(data.output).toContain("ssl: true");
        expect(data.output).toContain("poolSize: 20");
        expect(data.output).toContain("timeout: 5000");
      }
    });

    it("should handle deeply nested merges", async () => {
      const yaml1 = `
level1:
  level2:
    level3:
      value1: a
`;
      const yaml2 = `
level1:
  level2:
    level3:
      value2: b
`;

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("value1: a");
        expect(data.output).toContain("value2: b");
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML in first input", async () => {
      const yaml1 = "invalid: yaml: syntax:";
      const yaml2 = "valid: yaml";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("first input");
      }
    });

    it("should return error for invalid YAML in second input", async () => {
      const yaml1 = "valid: yaml";
      const yaml2 = "invalid: yaml: syntax:";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("second input");
      }
    });

    it("should return error for malformed indentation", async () => {
      const yaml1 = "key:\n  subkey: value\n wrong: indent";
      const yaml2 = "valid: yaml";

      const result = await executeTool(yamlMerge, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute - combining options", () => {
    it("should combine strategy and arrayMerge options", async () => {
      const yaml1 = `
config:
  items:
    - a
    - b
  nested:
    value: 1
`;
      const yaml2 = `
config:
  items:
    - c
  nested:
    other: 2
`;

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { strategy: "deep", arrayMerge: "concat" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("- a");
        expect(data.output).toContain("- b");
        expect(data.output).toContain("- c");
        expect(data.output).toContain("value: 1");
        expect(data.output).toContain("other: 2");
      }
    });

    it("should combine all options", async () => {
      const yaml1 = "parent:\n  items:\n    - a\n    - b";
      const yaml2 = "parent:\n  items:\n    - b\n    - c";

      const result = await executeTool(
        yamlMerge,
        { input1: yaml1, input2: yaml2 },
        { strategy: "deep", arrayMerge: "unique", indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        expect(data.output).toContain("    items:");
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = yamlMerge.execute(
        { input1: "a: 1", input2: "b: 2" },
        undefined
      );
      expect(result.output).toContain("a: 1");
      expect(result.output).toContain("b: 2");
    });

    it("should default to deep strategy", () => {
      const result = yamlMerge.execute(
        { input1: "a:\n  x: 1", input2: "a:\n  'y': 2" },
        undefined
      );
      expect(result.output).toContain("x: 1");
      // The output format may vary, just check y key exists
      expect(result.output).toMatch(/y.*:.*2/);
    });

    it("should default to replace arrayMerge", () => {
      const result = yamlMerge.execute(
        { input1: "items:\n  - a", input2: "items:\n  - b" },
        undefined
      );
      expect(result.output).toContain("- b");
      expect(result.output).not.toContain("- a");
    });
  });
});
