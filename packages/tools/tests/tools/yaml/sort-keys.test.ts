import { describe, it, expect } from "vitest";
import { yamlSortKeys } from "../../../src/tools/yaml/sort-keys";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface SortKeysOutput {
  output: string;
}

describe("yamlSortKeys", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlSortKeys.meta.id).toBe("yaml/sort-keys");
    });

    it("should have correct name", () => {
      expect(yamlSortKeys.meta.name).toBe("YAML Sort Keys");
    });

    it("should be in yaml category", () => {
      expect(yamlSortKeys.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlSortKeys.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlSortKeys.meta.keywords).toContain("yaml");
      expect(yamlSortKeys.meta.keywords).toContain("sort");
      expect(yamlSortKeys.meta.keywords).toContain("keys");
    });
  });

  describe("execute - ascending order (default)", () => {
    it("should sort keys alphabetically ascending", async () => {
      const input = "zebra: 1\nalpha: 2\nmiddle: 3";
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const lines = data.output.trim().split("\n");
        expect(lines[0]).toContain("alpha:");
        expect(lines[1]).toContain("middle:");
        expect(lines[2]).toContain("zebra:");
      }
    });

    it("should sort nested keys recursively by default", async () => {
      const input = `
parent:
  zebra: 1
  alpha: 2
`;
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const alphaIndex = data.output.indexOf("alpha:");
        const zebraIndex = data.output.indexOf("zebra:");
        expect(alphaIndex).toBeLessThan(zebraIndex);
      }
    });

    it("should sort multiple levels deep", async () => {
      const input = `
level1:
  z: 1
  a: 2
  nested:
    z: 3
    a: 4
`;
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const output = data.output;
        // Check that 'a' comes before 'z' at each level
        const firstA = output.indexOf("a:");
        const firstZ = output.indexOf("z:");
        expect(firstA).toBeLessThan(firstZ);
      }
    });
  });

  describe("execute - descending order", () => {
    it("should sort keys alphabetically descending", async () => {
      const input = "alpha: 1\nmiddle: 2\nzebra: 3";
      const result = await executeTool(
        yamlSortKeys,
        { input },
        { order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const lines = data.output.trim().split("\n");
        expect(lines[0]).toContain("zebra:");
        expect(lines[1]).toContain("middle:");
        expect(lines[2]).toContain("alpha:");
      }
    });

    it("should sort nested keys descending when specified", async () => {
      const input = `
parent:
  alpha: 1
  zebra: 2
`;
      const result = await executeTool(
        yamlSortKeys,
        { input },
        { order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const zebraIndex = data.output.indexOf("zebra:");
        const alphaIndex = data.output.indexOf("alpha:");
        expect(zebraIndex).toBeLessThan(alphaIndex);
      }
    });
  });

  describe("execute - deep option", () => {
    it("should sort only top-level when deep is false", async () => {
      const input = `
zebra:
  zz: 1
  aa: 2
alpha: 3
`;
      const result = await executeTool(
        yamlSortKeys,
        { input },
        { deep: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Top level should be sorted
        const alphaIndex = data.output.indexOf("alpha:");
        const zebraIndex = data.output.indexOf("zebra:");
        expect(alphaIndex).toBeLessThan(zebraIndex);

        // But nested should remain in original order (zz before aa)
        const zzIndex = data.output.indexOf("zz:");
        const aaIndex = data.output.indexOf("aa:");
        expect(zzIndex).toBeLessThan(aaIndex);
      }
    });

    it("should sort all levels when deep is true", async () => {
      const input = `
zebra:
  z: 1
  a: 2
alpha: 3
`;
      const result = await executeTool(yamlSortKeys, { input }, { deep: true });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Nested should also be sorted
        const output = data.output;
        const lines = output.split("\n").filter((l) => l.trim());
        const nestedLines = lines.slice(1, 3);
        // 'a' should come before 'z' in nested
        expect(nestedLines[0]).toContain("a:");
      }
    });
  });

  describe("execute - indent option", () => {
    it("should use default 2-space indent", async () => {
      const input = "parent:\n  child: value";
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output).toContain("  child:");
      }
    });

    it("should respect custom indent", async () => {
      const input = "parent:\n  child: value";
      const result = await executeTool(yamlSortKeys, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output).toContain("    child:");
      }
    });
  });

  describe("execute - arrays", () => {
    it("should preserve array order", async () => {
      const input = "items:\n  - c\n  - a\n  - b";
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Arrays should not be sorted (only object keys)
        const output = data.output;
        const cIndex = output.indexOf("- c");
        const aIndex = output.indexOf("- a");
        const bIndex = output.indexOf("- b");
        expect(cIndex).toBeLessThan(aIndex);
        expect(aIndex).toBeLessThan(bIndex);
      }
    });

    it("should sort keys within objects in arrays", async () => {
      const input = `
items:
  - zebra: 1
    alpha: 2
  - zebra: 3
    alpha: 4
`;
      const result = await executeTool(yamlSortKeys, { input }, { deep: true });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Each object in the array should have sorted keys
        // Find the first object's keys
        const firstAlpha = data.output.indexOf("alpha:");
        const firstZebra = data.output.indexOf("zebra:");
        expect(firstAlpha).toBeLessThan(firstZebra);
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty input", async () => {
      const result = await executeTool(yamlSortKeys, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Empty YAML parses to null
        expect(data.output).toBeDefined();
      }
    });

    it("should handle null value", async () => {
      const result = await executeTool(yamlSortKeys, { input: "value: null" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output).toContain("null");
      }
    });

    it("should handle primitive root value", async () => {
      const result = await executeTool(yamlSortKeys, { input: "42" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output.trim()).toBe("42");
      }
    });

    it("should handle array root value", async () => {
      const result = await executeTool(yamlSortKeys, {
        input: "- a\n- b\n- c",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output).toContain("- a");
        expect(data.output).toContain("- b");
        expect(data.output).toContain("- c");
      }
    });

    it("should handle special characters in keys", async () => {
      const input = '"z-key": 1\n"a-key": 2';
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const aIndex = data.output.indexOf("a-key");
        const zIndex = data.output.indexOf("z-key");
        expect(aIndex).toBeLessThan(zIndex);
      }
    });

    it("should handle numeric keys", async () => {
      const input = '"2": b\n"1": a\n"10": c';
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // Locale compare treats strings, so "1" < "10" < "2"
        expect(data.output).toBeDefined();
      }
    });

    it("should handle boolean values", async () => {
      const input = "b_enabled: true\na_disabled: false";
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const aIndex = data.output.indexOf("a_disabled:");
        const bIndex = data.output.indexOf("b_enabled:");
        expect(aIndex).toBeLessThan(bIndex);
      }
    });
  });

  describe("execute - combining options", () => {
    it("should combine order and deep options", async () => {
      const input = `
parent:
  a: 1
  z: 2
`;
      const result = await executeTool(
        yamlSortKeys,
        { input },
        { order: "desc", deep: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        const zIndex = data.output.indexOf("z:");
        const aIndex = data.output.indexOf("a:");
        expect(zIndex).toBeLessThan(aIndex);
      }
    });

    it("should combine all options", async () => {
      const input = `
zebra:
  z: 1
  a: 2
alpha: 3
`;
      const result = await executeTool(
        yamlSortKeys,
        { input },
        { order: "desc", deep: true, indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        expect(data.output).toContain("    z:");
        // zebra should come before alpha in descending order
        const zebraIndex = data.output.indexOf("zebra:");
        const alphaIndex = data.output.indexOf("alpha:");
        expect(zebraIndex).toBeLessThan(alphaIndex);
      }
    });
  });

  describe("execute - complex structures", () => {
    it("should handle config-like structure", async () => {
      const input = `
server:
  port: 3000
  host: localhost
database:
  url: mongodb://localhost
  options:
    poolSize: 10
    timeout: 5000
`;
      const result = await executeTool(yamlSortKeys, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortKeysOutput;
        // database should come before server
        const databaseIndex = data.output.indexOf("database:");
        const serverIndex = data.output.indexOf("server:");
        expect(databaseIndex).toBeLessThan(serverIndex);
        // host should come before port
        const hostIndex = data.output.indexOf("host:");
        const portIndex = data.output.indexOf("port:");
        expect(hostIndex).toBeLessThan(portIndex);
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML", async () => {
      const result = await executeTool(yamlSortKeys, {
        input: "invalid: yaml: syntax:",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });

    it("should return error for malformed indentation", async () => {
      const result = await executeTool(yamlSortKeys, {
        input: "key:\n  subkey: value\n wrong: indent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = yamlSortKeys.execute(
        { input: "z: 1\na: 2" },
        undefined
      ) as SortKeysOutput;
      const aIndex = result.output.indexOf("a:");
      const zIndex = result.output.indexOf("z:");
      expect(aIndex).toBeLessThan(zIndex);
    });

    it("should default to asc order", () => {
      const result = yamlSortKeys.execute(
        { input: "z: 1\na: 2" },
        undefined
      ) as SortKeysOutput;
      const lines = result.output.trim().split("\n");
      expect(lines[0]).toContain("a:");
    });

    it("should default to deep true", () => {
      const result = yamlSortKeys.execute(
        { input: "parent:\n  z: 1\n  a: 2" },
        undefined
      ) as SortKeysOutput;
      const aIndex = result.output.indexOf("a:");
      const zIndex = result.output.indexOf("z:");
      expect(aIndex).toBeLessThan(zIndex);
    });

    it("should handle error cases gracefully", () => {
      // Test that the tool handles non-parseable YAML properly
      expect(() =>
        yamlSortKeys.execute({ input: "invalid: yaml: syntax:" }, undefined)
      ).toThrow();
    });
  });
});
