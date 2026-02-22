import { describe, it, expect } from "vitest";
import { json5ToJson } from "../../../src/tools/data/json5-to-json";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("json5ToJson", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(json5ToJson.meta.id).toBe("data/json5-to-json");
    });

    it("should have correct name", () => {
      expect(json5ToJson.meta.name).toBe("JSON5 to JSON");
    });

    it("should be in data category", () => {
      expect(json5ToJson.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(json5ToJson.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(json5ToJson.meta.keywords).toContain("json5");
      expect(json5ToJson.meta.keywords).toContain("json");
      expect(json5ToJson.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert valid standard JSON", async () => {
      const input = '{"name": "test", "value": 123}';
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should remove single-line comments", async () => {
      const input = `{
  // This is a comment
  "name": "test"
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(data.output).not.toContain("//");
      }
    });

    it("should remove multi-line comments", async () => {
      const input = `{
  /* This is a
     multi-line comment */
  "name": "test"
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(data.output).not.toContain("/*");
      }
    });

    it("should handle trailing commas", async () => {
      const input = `{
  "name": "test",
  "value": 123,
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should handle trailing commas in arrays", async () => {
      const input = `{
  "items": [1, 2, 3,]
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.items).toEqual([1, 2, 3]);
      }
    });

    it("should handle unquoted keys", async () => {
      const input = `{
  name: "test",
  value: 123
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should handle single-quoted strings", async () => {
      const input = `{
  "name": 'test',
  'greeting': 'hello world'
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.greeting).toBe("hello world");
      }
    });

    it("should handle hexadecimal numbers", async () => {
      const input = `{
  "color": 0xFF0000
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.color).toBe(16711680); // 0xFF0000 = 16711680
      }
    });

    it("should handle leading decimal point", async () => {
      const input = `{
  "value": .5
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(0.5);
      }
    });

    it("should handle trailing decimal point", async () => {
      const input = `{
  "value": 5.
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(5.0);
      }
    });

    it("should handle positive sign on numbers", async () => {
      const input = `{
  "value": +5
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(5);
      }
    });

    it("should handle Infinity (converts to null)", async () => {
      const input = `{
  "value": Infinity
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(null);
      }
    });

    it("should handle -Infinity (converts to null)", async () => {
      const input = `{
  "value": -Infinity
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(null);
      }
    });

    it("should handle NaN (converts to null)", async () => {
      const input = `{
  "value": NaN
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(null);
      }
    });

    it("should handle complex JSON5 with multiple features", async () => {
      const input = `{
  // Database configuration
  database: {
    host: 'localhost',
    port: 5432, // Default PostgreSQL port
  },

  /* API settings */
  api: {
    timeout: 30000,
    retries: 3,
  },
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const database = parsed.database as Record<string, unknown>;
        const api = parsed.api as Record<string, unknown>;
        expect(database.host).toBe("localhost");
        expect(database.port).toBe(5432);
        expect(api.timeout).toBe(30000);
        expect(api.retries).toBe(3);
      }
    });

    it("should not remove comments inside strings", async () => {
      const input = '{"url": "http://example.com"}';
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.url).toBe("http://example.com");
      }
    });

    it("should handle empty object", async () => {
      const input = "{}";
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed).toEqual({});
      }
    });

    it("should handle empty array", async () => {
      const input = "[]";
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as unknown[];
        expect(parsed).toEqual([]);
      }
    });

    it("should use default indent of 2 spaces", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("  ");
      }
    });

    it("should respect custom indent option", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(json5ToJson, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("    ");
      }
    });

    it("should handle indent of 0 (minified)", async () => {
      const input = '{"name": "test"}';
      const result = await executeTool(json5ToJson, { input }, { indent: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).not.toContain("\n");
      }
    });

    it("should handle boolean values", async () => {
      const input = `{
  enabled: true,
  disabled: false
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.enabled).toBe(true);
        expect(parsed.disabled).toBe(false);
      }
    });

    it("should handle null values", async () => {
      const input = `{
  value: null
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.value).toBe(null);
      }
    });

    it("should handle escaped characters in single-quoted strings", async () => {
      const input = `{
  "escaped": 'it\\'s working'
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.escaped).toBe("it's working");
      }
    });

    it("should handle double quotes inside single-quoted strings", async () => {
      const input = `{
  "message": 'She said "hello"'
}`;
      const result = await executeTool(json5ToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.message).toBe('She said "hello"');
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(json5ToJson, {
        input: '{"test": true}',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have indent option defined", () => {
      expect(json5ToJson.optionsSchema).toBeDefined();
    });

    it("should reject indent below minimum", async () => {
      const result = await executeTool(
        json5ToJson,
        { input: '{"test": true}' },
        { indent: -1 }
      );

      expect(result.success).toBe(false);
    });

    it("should reject indent above maximum", async () => {
      const result = await executeTool(
        json5ToJson,
        { input: '{"test": true}' },
        { indent: 9 }
      );

      expect(result.success).toBe(false);
    });

    it("should accept indent at minimum (0)", async () => {
      const result = await executeTool(
        json5ToJson,
        { input: '{"test": true}' },
        { indent: 0 }
      );

      expect(result.success).toBe(true);
    });

    it("should accept indent at maximum (8)", async () => {
      const result = await executeTool(
        json5ToJson,
        { input: '{"test": true}' },
        { indent: 8 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should convert JSON5 when called directly", () => {
      const result = json5ToJson.execute({ input: '{"name": "test"}' }) as {
        output: string;
      };
      const parsed = JSON.parse(result.output) as Record<string, unknown>;
      expect(parsed.name).toBe("test");
    });

    it("should use default indent when options is undefined", () => {
      const result = json5ToJson.execute(
        { input: '{"name": "test"}' },
        undefined
      ) as Record<string, unknown>;
      expect(result.output).toContain("  ");
    });
  });
});
