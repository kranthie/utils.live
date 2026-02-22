import { describe, it, expect } from "vitest";
import { ndjsonParser } from "../../../src/tools/data/ndjson-parser";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("ndjsonParser", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(ndjsonParser.meta.id).toBe("data/ndjson-parser");
    });

    it("should have correct name", () => {
      expect(ndjsonParser.meta.name).toBe("NDJSON Parser");
    });

    it("should be in data category", () => {
      expect(ndjsonParser.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(ndjsonParser.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(ndjsonParser.meta.keywords).toContain("ndjson");
      expect(ndjsonParser.meta.keywords).toContain("jsonl");
      expect(ndjsonParser.meta.keywords).toContain("parse");
    });
  });

  describe("execute", () => {
    it("should parse single line NDJSON", async () => {
      const input = '{"name": "test", "value": 123}';
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as unknown[];
        expect(parsed).toHaveLength(1);
        expect((parsed[0] as Record<string, unknown>).name).toBe("test");
        expect(data.lineCount).toBe(1);
      }
    });

    it("should parse multiple lines NDJSON", async () => {
      const input = `{"id": 1, "name": "Alice"}
{"id": 2, "name": "Bob"}
{"id": 3, "name": "Charlie"}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(3);
        expect(parsed[0]!.name).toBe("Alice");
        expect(parsed[1]!.name).toBe("Bob");
        expect(parsed[2]!.name).toBe("Charlie");
        expect(data.lineCount).toBe(3);
      }
    });

    it("should skip empty lines by default", async () => {
      const input = `{"id": 1}

{"id": 2}

`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as unknown[];
        expect(parsed).toHaveLength(2);
        expect(data.lineCount).toBe(2);
      }
    });

    it("should parse NDJSON with nested objects", async () => {
      const input = `{"user": {"name": "Alice", "age": 30}}
{"user": {"name": "Bob", "age": 25}}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(2);
        expect((parsed[0]!.user as Record<string, unknown>).name).toBe("Alice");
      }
    });

    it("should parse NDJSON with arrays", async () => {
      const input = `{"items": [1, 2, 3]}
{"items": [4, 5, 6]}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(2);
        expect(parsed[0]!.items).toEqual([1, 2, 3]);
      }
    });

    it("should use default indent of 2 spaces", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("  ");
      }
    });

    it("should respect custom indent option", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(ndjsonParser, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("    ");
      }
    });

    it("should handle indent of 0 (minified)", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(ndjsonParser, { input }, { indent: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toBe('[{"name":"test"}]');
      }
    });

    it("should fail on invalid JSON line", async () => {
      const input = `{"id": 1}
{invalid json}
{"id": 2}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("line 2");
      }
    });

    it("should skip invalid lines when skipInvalid is true", async () => {
      const input = `{"id": 1}
{invalid json}
{"id": 2}`;
      const result = await executeTool(
        ndjsonParser,
        { input },
        { skipInvalid: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          output: string;
          lineCount: number;
          errors: Array<{ line: number; error: string }>;
        };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(2);
        expect(parsed[0]!.id).toBe(1);
        expect(parsed[1]!.id).toBe(2);
        expect(data.lineCount).toBe(2);
        // Verify errors are reported
        expect(data.errors).toHaveLength(1);
        expect(data.errors[0]!.line).toBe(2);
        expect(data.errors[0]!.error).toBeTruthy(); // Error message varies by JS engine
      }
    });

    it("should return empty errors array when all lines are valid", async () => {
      const input = `{"id": 1}
{"id": 2}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          output: string;
          lineCount: number;
          errors: Array<{ line: number; error: string }>;
        };
        expect(data.errors).toEqual([]);
      }
    });

    it("should report multiple errors when skipInvalid is true", async () => {
      const input = `{"id": 1}
{invalid}
{"id": 2}
also invalid
{"id": 3}`;
      const result = await executeTool(
        ndjsonParser,
        { input },
        { skipInvalid: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          output: string;
          lineCount: number;
          errors: Array<{ line: number; error: string }>;
        };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(3);
        expect(data.lineCount).toBe(3);
        expect(data.errors).toHaveLength(2);
        expect(data.errors[0]!.line).toBe(2);
        expect(data.errors[1]!.line).toBe(4);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(ndjsonParser, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as unknown[];
        expect(parsed).toEqual([]);
        expect(data.lineCount).toBe(0);
      }
    });

    it("should handle NDJSON with various JSON types", async () => {
      const input = `{"string": "hello"}
{"number": 42}
{"boolean": true}
{"null": null}
{"array": [1, 2, 3]}`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(5);
        expect(parsed[0]!.string).toBe("hello");
        expect(parsed[1]!.number).toBe(42);
        expect(parsed[2]!.boolean).toBe(true);
        expect(parsed[3]!.null).toBe(null);
        expect(parsed[4]!.array).toEqual([1, 2, 3]);
      }
    });

    it("should handle lines with leading/trailing whitespace", async () => {
      const input = `  {"id": 1}
	{"id": 2}	`;
      const result = await executeTool(ndjsonParser, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed).toHaveLength(2);
        expect(parsed[0]!.id).toBe(1);
        expect(parsed[1]!.id).toBe(2);
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(ndjsonParser, {
        input: '{"test": true}',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have indent option defined", () => {
      expect(ndjsonParser.optionsSchema).toBeDefined();
    });

    it("should reject indent below minimum", async () => {
      const result = await executeTool(
        ndjsonParser,
        { input: '{"test": true}' },
        { indent: -1 }
      );

      expect(result.success).toBe(false);
    });

    it("should reject indent above maximum", async () => {
      const result = await executeTool(
        ndjsonParser,
        { input: '{"test": true}' },
        { indent: 9 }
      );

      expect(result.success).toBe(false);
    });

    it("should accept indent at minimum (0)", async () => {
      const result = await executeTool(
        ndjsonParser,
        { input: '{"test": true}' },
        { indent: 0 }
      );

      expect(result.success).toBe(true);
    });

    it("should accept indent at maximum (8)", async () => {
      const result = await executeTool(
        ndjsonParser,
        { input: '{"test": true}' },
        { indent: 8 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should parse NDJSON when called directly", () => {
      const result = ndjsonParser.execute({ input: '{"name": "test"}' }) as {
        output: string;
        lineCount: number;
      };
      const parsed = JSON.parse(result.output) as Record<string, unknown>[];
      const first = parsed[0];
      if (first) {
        expect(first.name).toBe("test");
      }
      expect(result.lineCount).toBe(1);
    });

    it("should use default options when options is undefined", () => {
      const result = ndjsonParser.execute(
        { input: '{"name": "test"}' },
        undefined
      ) as Record<string, unknown>;
      expect(result.output).toContain("  ");
    });
  });
});
