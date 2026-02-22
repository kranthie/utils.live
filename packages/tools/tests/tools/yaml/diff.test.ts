import { describe, it, expect } from "vitest";
import { yamlDiff } from "../../../src/tools/yaml/diff";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface DiffOutput {
  identical: boolean;
  differences: Array<{
    path: string;
    type: "added" | "removed" | "changed" | "type_changed";
    oldValue?: unknown;
    newValue?: unknown;
  }>;
  summary: {
    added: number;
    removed: number;
    changed: number;
    total: number;
  };
}

describe("yamlDiff", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(yamlDiff.meta.id).toBe("yaml/diff");
    });

    it("should have correct name", () => {
      expect(yamlDiff.meta.name).toBe("YAML Diff");
    });

    it("should be in yaml category", () => {
      expect(yamlDiff.meta.category).toBe("yaml");
    });

    it("should be CLIENT tier", () => {
      expect(yamlDiff.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(yamlDiff.meta.keywords).toContain("yaml");
      expect(yamlDiff.meta.keywords).toContain("diff");
      expect(yamlDiff.meta.keywords).toContain("compare");
    });
  });

  describe("execute - identical documents", () => {
    it("should detect identical simple documents", async () => {
      const yaml1 = "name: test\nvalue: 123";
      const yaml2 = "name: test\nvalue: 123";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
        expect(data.differences).toHaveLength(0);
        expect(data.summary.total).toBe(0);
      }
    });

    it("should detect identical nested documents", async () => {
      const yaml1 = `
user:
  name: John
  age: 30
  address:
    city: NYC
`;
      const yaml2 = `
user:
  name: John
  age: 30
  address:
    city: NYC
`;

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });

    it("should detect identical arrays", async () => {
      const yaml1 = "items:\n  - a\n  - b\n  - c";
      const yaml2 = "items:\n  - a\n  - b\n  - c";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });
  });

  describe("execute - added differences", () => {
    it("should detect added keys", async () => {
      const yaml1 = "name: test";
      const yaml2 = "name: test\nvalue: 123";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences).toHaveLength(1);
        expect(data.differences[0]!.type).toBe("added");
        expect(data.differences[0]!.path).toBe("$.value");
        expect(data.differences[0]!.newValue).toBe(123);
        expect(data.summary.added).toBe(1);
      }
    });

    it("should detect added nested keys", async () => {
      const yaml1 = "user:\n  name: John";
      const yaml2 = "user:\n  name: John\n  age: 30";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        const addedDiff = data.differences.find((d) => d.type === "added");
        expect(addedDiff).toBeDefined();
        expect(addedDiff?.path).toBe("$.user.age");
      }
    });

    it("should detect added array elements", async () => {
      const yaml1 = "items:\n  - a\n  - b";
      const yaml2 = "items:\n  - a\n  - b\n  - c";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("added");
        expect(data.differences[0]!.path).toBe("$.items[2]");
      }
    });
  });

  describe("execute - removed differences", () => {
    it("should detect removed keys", async () => {
      const yaml1 = "name: test\nvalue: 123";
      const yaml2 = "name: test";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("removed");
        expect(data.differences[0]!.path).toBe("$.value");
        expect(data.differences[0]!.oldValue).toBe(123);
        expect(data.summary.removed).toBe(1);
      }
    });

    it("should detect removed array elements", async () => {
      const yaml1 = "items:\n  - a\n  - b\n  - c";
      const yaml2 = "items:\n  - a\n  - b";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("removed");
      }
    });
  });

  describe("execute - changed differences", () => {
    it("should detect changed values", async () => {
      const yaml1 = "name: test\nvalue: 123";
      const yaml2 = "name: test\nvalue: 456";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("changed");
        expect(data.differences[0]!.path).toBe("$.value");
        expect(data.differences[0]!.oldValue).toBe(123);
        expect(data.differences[0]!.newValue).toBe(456);
        expect(data.summary.changed).toBe(1);
      }
    });

    it("should detect type changes", async () => {
      const yaml1 = "value: 123";
      const yaml2 = 'value: "123"';

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("type_changed");
      }
    });

    it("should detect changed string values", async () => {
      const yaml1 = "name: John";
      const yaml2 = "name: Jane";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("changed");
        expect(data.differences[0]!.oldValue).toBe("John");
        expect(data.differences[0]!.newValue).toBe("Jane");
      }
    });
  });

  describe("execute - complex differences", () => {
    it("should handle multiple differences", async () => {
      const yaml1 = `
name: test
items:
  - a
  - b
config:
  enabled: true
`;
      const yaml2 = `
name: updated
items:
  - a
  - c
config:
  enabled: false
  debug: true
`;

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.summary.total).toBeGreaterThan(0);
        expect(data.summary.added).toBeGreaterThanOrEqual(0);
        expect(data.summary.changed).toBeGreaterThanOrEqual(0);
      }
    });

    it("should detect object to array type change", async () => {
      const yaml1 = "data:\n  key: value";
      const yaml2 = "data:\n  - item1\n  - item2";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.type).toBe("type_changed");
      }
    });
  });

  describe("execute - edge cases", () => {
    it("should handle empty documents", async () => {
      const yaml1 = "";
      const yaml2 = "";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });

    it("should handle null values", async () => {
      const yaml1 = "value: null";
      const yaml2 = "value: null";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });

    it("should handle null to value change", async () => {
      const yaml1 = "value: null";
      const yaml2 = "value: test";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
      }
    });

    it("should handle special characters in keys", async () => {
      const yaml1 = '"special-key": value1';
      const yaml2 = '"special-key": value2';

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
      }
    });

    it("should handle boolean values", async () => {
      const yaml1 = "enabled: true";
      const yaml2 = "enabled: false";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.differences[0]!.oldValue).toBe(true);
        expect(data.differences[0]!.newValue).toBe(false);
      }
    });
  });

  describe("execute - error handling", () => {
    it("should return error for invalid YAML in first input", async () => {
      const yaml1 = "invalid: yaml: syntax:";
      const yaml2 = "valid: yaml";

      const result = await executeTool(yamlDiff, {
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

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
        expect(result.error.message).toContain("second input");
      }
    });

    it("should return error for malformed YAML structure", async () => {
      const yaml1 = "key:\n  subkey: value\n wrong: indent";
      const yaml2 = "valid: yaml";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("YAML_PARSE_ERROR");
      }
    });
  });

  describe("execute - summary accuracy", () => {
    it("should correctly count added items in summary", async () => {
      const yaml1 = "a: 1";
      const yaml2 = "a: 1\nb: 2\nc: 3";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.summary.added).toBe(2);
        expect(data.summary.removed).toBe(0);
        expect(data.summary.changed).toBe(0);
        expect(data.summary.total).toBe(2);
      }
    });

    it("should correctly count removed items in summary", async () => {
      const yaml1 = "a: 1\nb: 2\nc: 3";
      const yaml2 = "a: 1";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.summary.removed).toBe(2);
        expect(data.summary.added).toBe(0);
        expect(data.summary.total).toBe(2);
      }
    });

    it("should correctly count changed items including type_changed", async () => {
      const yaml1 = 'a: 1\nb: "text"';
      const yaml2 = "a: 2\nb: 123";

      const result = await executeTool(yamlDiff, {
        input1: yaml1,
        input2: yaml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.summary.changed).toBe(2);
        expect(data.summary.total).toBe(2);
      }
    });
  });
});
