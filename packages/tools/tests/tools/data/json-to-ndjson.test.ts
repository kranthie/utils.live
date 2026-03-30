import { describe, it, expect } from "vitest";
import { jsonToNdjson } from "../../../src/tools/data/json-to-ndjson";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonToNdjson", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(jsonToNdjson.meta.id).toBe("data/json-to-ndjson");
    });

    it("should have correct name", () => {
      expect(jsonToNdjson.meta.name).toBe("JSON to NDJSON");
    });

    it("should be in data category", () => {
      expect(jsonToNdjson.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(jsonToNdjson.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(jsonToNdjson.meta.keywords).toContain("json");
      expect(jsonToNdjson.meta.keywords).toContain("ndjson");
      expect(jsonToNdjson.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert single-element array to NDJSON", async () => {
      const input = '[{"name": "test", "value": 123}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        expect(data.output).toBe('{"name":"test","value":123}');
        expect(data.lineCount).toBe(1);
      }
    });

    it("should convert multi-element array to NDJSON", async () => {
      const input = '[{"id": 1}, {"id": 2}, {"id": 3}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(3);
        expect(lines[0]).toBe('{"id":1}');
        expect(lines[1]).toBe('{"id":2}');
        expect(lines[2]).toBe('{"id":3}');
        expect(data.lineCount).toBe(3);
      }
    });

    it("should handle array with nested objects", async () => {
      const input = '[{"user": {"name": "Alice", "age": 30}}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed).toEqual({ user: { name: "Alice", age: 30 } });
      }
    });

    it("should handle array with arrays inside", async () => {
      const input = '[{"items": [1, 2, 3]}, {"items": [4, 5, 6]}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(2);
        const first = JSON.parse(lines[0]!) as Record<string, unknown>;
        expect(first.items).toEqual([1, 2, 3]);
      }
    });

    it("should handle empty array", async () => {
      const input = "[]";
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        expect(data.output).toBe("");
        expect(data.lineCount).toBe(0);
      }
    });

    it("should handle array with primitive values", async () => {
      const input = '[1, "hello", true, null]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(4);
        expect(lines[0]).toBe("1");
        expect(lines[1]).toBe('"hello"');
        expect(lines[2]).toBe("true");
        expect(lines[3]).toBe("null");
      }
    });

    it("should fail on invalid JSON", async () => {
      const input = "{not valid json}";
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid JSON");
      }
    });

    it("should fail when input is not an array", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("must be a JSON array");
      }
    });

    it("should fail when input is a string", async () => {
      const input = '"just a string"';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("must be a JSON array");
      }
    });

    it("should fail when input is a number", async () => {
      const input = "42";
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("must be a JSON array");
      }
    });

    it("should handle array with special characters in strings", async () => {
      const input = '[{"message": "Hello\\nWorld"}, {"emoji": "\\u2764"}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(2);
      }
    });

    it("should handle large arrays", async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const input = JSON.stringify(items);
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string; lineCount: number };
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(100);
        expect(data.lineCount).toBe(100);
      }
    });

    it("should produce compact output by default", async () => {
      const input = '[{"name": "test", "value": 123}]';
      const result = await executeTool(jsonToNdjson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        // Compact output has no extra whitespace
        expect(data.output).not.toContain("\n ");
        expect(data.output).toBe('{"name":"test","value":123}');
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(jsonToNdjson, {
        input: '[{"test": true}]',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have compact option defined", () => {
      expect(jsonToNdjson.optionsSchema).toBeDefined();
    });

    it("should work with compact: true", async () => {
      const result = await executeTool(
        jsonToNdjson,
        { input: '[{"test": true}]' },
        { compact: true }
      );

      expect(result.success).toBe(true);
    });

    it("should work with compact: false", async () => {
      const result = await executeTool(
        jsonToNdjson,
        { input: '[{"test": true}]' },
        { compact: false }
      );

      expect(result.success).toBe(true);
    });

    it("should produce readable output with compact: false", async () => {
      const input = '[{"name": "test", "value": 123}]';
      const result = await executeTool(
        jsonToNdjson,
        { input },
        { compact: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        // Non-compact output should have spaces after colons and commas
        expect(data.output).toContain(": ");
        expect(data.output).toContain(", ");
        expect(data.output).toBe('{"name": "test", "value": 123}');
      }
    });
  });

  describe("execute function directly", () => {
    it("should convert JSON array when called directly", () => {
      const result = jsonToNdjson.execute({
        input: '[{"name": "test"}]',
      }) as Record<string, unknown>;
      expect(result.output).toBe('{"name":"test"}');
      expect(result.lineCount).toBe(1);
    });

    it("should use default options when options is undefined", () => {
      const result = jsonToNdjson.execute(
        { input: '[{"name": "test"}]' },
        undefined
      ) as Record<string, unknown>;
      expect(result.output).toBe('{"name":"test"}');
    });
  });

  describe("compact: false correctness", () => {
    it("should not corrupt URL values containing colons when compact is false", async () => {
      const input = '[{"url": "http://example.com"}]';
      const result = await executeTool(
        jsonToNdjson,
        { input },
        { compact: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.url).toBe("http://example.com");
      }
    });

    it("should not corrupt time values containing colons when compact is false", async () => {
      const input = '[{"time": "12:30:00"}]';
      const result = await executeTool(
        jsonToNdjson,
        { input },
        { compact: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.time).toBe("12:30:00");
      }
    });

    it("should not corrupt ISO timestamp values when compact is false", async () => {
      const input = '[{"ts": "2024-01-01T00:00:00Z"}]';
      const result = await executeTool(
        jsonToNdjson,
        { input },
        { compact: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.ts).toBe("2024-01-01T00:00:00Z");
      }
    });

    it("should produce valid parseable JSON with spaces after structural tokens when compact is false", async () => {
      const input = '[{"a": 1, "b": 2}]';
      const result = await executeTool(
        jsonToNdjson,
        { input },
        { compact: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.a).toBe(1);
        expect(parsed.b).toBe(2);
      }
    });
  });

  describe("roundtrip", () => {
    it("should roundtrip correctly with ndjson-parser", async () => {
      const original = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ];

      // Convert JSON to NDJSON
      const toNdjsonResult = await executeTool(jsonToNdjson, {
        input: JSON.stringify(original),
      });

      expect(toNdjsonResult.success).toBe(true);
      if (toNdjsonResult.success) {
        const data = toNdjsonResult.data as { output: string };
        // Parse each line back
        const lines = data.output.split("\n");
        const restored = lines.map((line) => JSON.parse(line) as unknown);
        expect(restored).toEqual(original);
      }
    });
  });
});
