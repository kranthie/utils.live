import { describe, it, expect } from "vitest";
import { tomlToJson } from "../../../src/tools/toml/to-json";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("tomlToJson", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(tomlToJson.meta.id).toBe("toml/to-json");
    });

    it("should have correct name", () => {
      expect(tomlToJson.meta.name).toBe("TOML to JSON");
    });

    it("should be in toml category", () => {
      expect(tomlToJson.meta.category).toBe("toml");
    });

    it("should be CLIENT tier", () => {
      expect(tomlToJson.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(tomlToJson.meta.keywords).toContain("toml");
      expect(tomlToJson.meta.keywords).toContain("json");
      expect(tomlToJson.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple key-value pairs to JSON", async () => {
      const input = `name="test"
value=123`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should convert nested tables to nested JSON objects", async () => {
      const input = `[server]
host="localhost"
port=8080

[server.ssl]
enabled=true`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const server = parsed.server as Record<string, unknown>;
        const ssl = server.ssl as Record<string, unknown>;
        expect(server.host).toBe("localhost");
        expect(server.port).toBe(8080);
        expect(ssl.enabled).toBe(true);
      }
    });

    it("should convert arrays to JSON arrays", async () => {
      const input = `numbers=[1, 2, 3]
names=["alice", "bob"]`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.numbers).toEqual([1, 2, 3]);
        expect(parsed.names).toEqual(["alice", "bob"]);
      }
    });

    it("should convert array of tables to array of objects", async () => {
      const input = `[[products]]
name="Hammer"
price=9.99

[[products]]
name="Nail"
price=0.05`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const products = parsed.products as Array<Record<string, unknown>>;
        expect(products).toHaveLength(2);
        expect(products[0]!.name).toBe("Hammer");
        expect(products[1]!.name).toBe("Nail");
      }
    });

    it("should handle boolean values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.enabled).toBe(true);
        expect(parsed.disabled).toBe(false);
      }
    });

    it("should handle float values", async () => {
      const input = `pi=3.14159
negative=-0.01`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.pi).toBeCloseTo(3.14159);
        expect(parsed.negative).toBeCloseTo(-0.01);
      }
    });

    it("should use default indent of 2 spaces", async () => {
      const input = `name="test"`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("  ");
      }
    });

    it("should respect custom indent option", async () => {
      const input = `name="test"`;
      const result = await executeTool(tomlToJson, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("    ");
      }
    });

    it("should handle indent of 0 (minified)", async () => {
      const input = `[server]
host="localhost"`;
      const result = await executeTool(tomlToJson, { input }, { indent: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).not.toContain("\n");
      }
    });

    it("should handle empty TOML", async () => {
      const result = await executeTool(tomlToJson, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed).toEqual({});
      }
    });

    it("should return error for invalid TOML", async () => {
      const result = await executeTool(tomlToJson, { input: "key=" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
        expect(result.error.message).toContain("Invalid TOML");
      }
    });

    it("should return error for invalid TOML - unclosed string", async () => {
      const result = await executeTool(tomlToJson, { input: 'name="unclosed' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TOML_PARSE_ERROR");
      }
    });

    it("should handle inline tables", async () => {
      const input = `point={x=1, y=2}`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const point = parsed.point as Record<string, unknown>;
        expect(point.x).toBe(1);
        expect(point.y).toBe(2);
      }
    });

    it("should handle dates and convert them appropriately", async () => {
      const input = `date=2024-01-15`;
      const result = await executeTool(tomlToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.date).toBeDefined();
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(tomlToJson, { input: 'name="test"' });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have indent option defined", () => {
      expect(tomlToJson.optionsSchema).toBeDefined();
    });

    it("should reject indent below minimum", async () => {
      const result = await executeTool(
        tomlToJson,
        { input: 'name="test"' },
        { indent: -1 }
      );

      expect(result.success).toBe(false);
    });

    it("should reject indent above maximum", async () => {
      const result = await executeTool(
        tomlToJson,
        { input: 'name="test"' },
        { indent: 9 }
      );

      expect(result.success).toBe(false);
    });
  });

  describe("execute function directly", () => {
    it("should convert TOML when called directly", () => {
      const result = tomlToJson.execute({ input: 'name="test"' }) as {
        output: string;
      };
      const parsed = JSON.parse(result.output) as Record<string, unknown>;
      expect(parsed.name).toBe("test");
    });

    it("should use default indent when options is undefined", () => {
      const result = tomlToJson.execute({ input: 'name="test"' }, undefined);
      expect(result.output).toContain("  ");
    });

    it("should throw error for invalid TOML", () => {
      expect(() => tomlToJson.execute({ input: "invalid=" })).toThrow();
    });
  });
});
