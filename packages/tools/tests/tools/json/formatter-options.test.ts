import { describe, it, expect } from "vitest";
import { jsonFormatter } from "../../../src/tools/json/formatter";
import { executeTool } from "../../../src/core/executor";

describe("JSON Formatter Options", () => {
  const validJson = '{"z":1,"a":2,"m":3}';

  describe("indent option", () => {
    it("should use default 2-space indent", async () => {
      const result = await executeTool(jsonFormatter, { input: '{"a":1}' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          '{\n  "a": 1\n}'
        );
      }
    });

    it("should respect custom indent of 4 spaces", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: 4 }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          '{\n    "a": 1\n}'
        );
      }
    });

    it("should support 0-space (minified) indent", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: 0 }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        // 0 indent produces minified output
        expect((result.data as Record<string, unknown>).output).toBe('{"a":1}');
      }
    });

    it("should support 8-space indent", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: 8 }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          '{\n        "a": 1\n}'
        );
      }
    });

    it("should reject indent greater than 8", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: 10 }
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("indent");
      }
    });

    it("should reject negative indent", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: -2 }
      );
      expect(result.success).toBe(false);
    });

    it("should reject non-integer indent", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"a":1}' },
        { indent: 2.5 }
      );
      expect(result.success).toBe(false);
    });
  });

  describe("sortKeys option", () => {
    it("should not sort keys by default", async () => {
      const result = await executeTool(jsonFormatter, { input: validJson });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        // Keys should be in original order: z, a, m
        expect(output).toContain('"z"');
        const outputKeys = output.match(/"[zam]"/g);
        expect(outputKeys).toEqual(['"z"', '"a"', '"m"']);
      }
    });

    it("should sort keys alphabetically when enabled", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: validJson },
        { sortKeys: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        // Keys should be sorted: a, m, z
        const output = (result.data as { output: string }).output;
        const outputKeys = output.match(/"[zam]"/g);
        expect(outputKeys).toEqual(['"a"', '"m"', '"z"']);
      }
    });

    it("should sort nested object keys", async () => {
      const nested = '{"z":{"c":1,"a":2},"b":3}';
      const result = await executeTool(
        jsonFormatter,
        { input: nested },
        { sortKeys: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        // b should come before z at top level
        expect(output.indexOf('"b"')).toBeLessThan(output.indexOf('"z"'));
        // a should come before c in nested
        expect(output.indexOf('"a"')).toBeLessThan(output.indexOf('"c"'));
      }
    });

    it("should sort keys in arrays of objects", async () => {
      const arrayInput = '[{"z":1,"a":2},{"m":3,"b":4}]';
      const result = await executeTool(
        jsonFormatter,
        { input: arrayInput },
        { sortKeys: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        const parsed = JSON.parse(output) as object[];
        expect(Object.keys(parsed[0] as object)).toEqual(["a", "z"]);
        expect(Object.keys(parsed[1] as object)).toEqual(["b", "m"]);
      }
    });
  });

  describe("combined options", () => {
    it("should apply both indent and sortKeys", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: validJson },
        { indent: 4, sortKeys: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        // Check 4-space indent
        expect(output).toContain('    "a"');
        // Check sorted keys
        const outputKeys = output.match(/"[zam]"/g);
        expect(outputKeys).toEqual(['"a"', '"m"', '"z"']);
      }
    });

    it("should apply defaults when options is undefined", async () => {
      const result = await executeTool(jsonFormatter, {
        input: '{"b":1,"a":2}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        // Default 2-space indent
        expect(output).toContain('  "b"');
        // Keys not sorted (default false)
        const outputKeys = output.match(/"[ab]"/g);
        expect(outputKeys).toEqual(['"b"', '"a"']);
      }
    });

    it("should apply defaults when options is empty object", async () => {
      const result = await executeTool(
        jsonFormatter,
        { input: '{"b":1,"a":2}' },
        {}
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as { output: string }).output;
        // Default 2-space indent
        expect(output).toContain('  "b"');
      }
    });
  });
});
