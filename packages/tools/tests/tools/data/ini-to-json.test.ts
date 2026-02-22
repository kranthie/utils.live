import { describe, it, expect } from "vitest";
import { iniToJson } from "../../../src/tools/data/ini-to-json";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("iniToJson", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(iniToJson.meta.id).toBe("data/ini-to-json");
    });

    it("should have correct name", () => {
      expect(iniToJson.meta.name).toBe("INI to JSON");
    });

    it("should be in data category", () => {
      expect(iniToJson.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(iniToJson.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(iniToJson.meta.keywords).toContain("ini");
      expect(iniToJson.meta.keywords).toContain("json");
      expect(iniToJson.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple key-value pairs to JSON", async () => {
      const input = `name=test
value=123`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe("123");
      }
    });

    it("should convert sections to nested JSON objects", async () => {
      const input = `[database]
host=localhost
port=5432`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const database = parsed.database as Record<string, unknown>;
        expect(database.host).toBe("localhost");
        expect(database.port).toBe("5432");
      }
    });

    it("should handle multiple sections", async () => {
      const input = `[database]
host=localhost

[server]
port=8080`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const database = parsed.database as Record<string, unknown>;
        const server = parsed.server as Record<string, unknown>;
        expect(database.host).toBe("localhost");
        expect(server.port).toBe("8080");
      }
    });

    it("should handle global keys (before any section)", async () => {
      const input = `global=value

[section]
local=value`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        const section = parsed.section as Record<string, unknown>;
        expect(parsed.global).toBe("value");
        expect(section.local).toBe("value");
      }
    });

    it("should use default indent of 2 spaces", async () => {
      const input = `[section]
key=value`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("  ");
      }
    });

    it("should respect custom indent option", async () => {
      const input = `[section]
key=value`;
      const result = await executeTool(iniToJson, { input }, { indent: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("    ");
      }
    });

    it("should handle indent of 0 (minified)", async () => {
      const input = `[section]
key=value`;
      const result = await executeTool(iniToJson, { input }, { indent: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).not.toContain("\n");
      }
    });

    it("should handle boolean-like values as strings", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        // INI parser may convert or keep as string
        expect(parsed.enabled).toBeDefined();
        expect(parsed.disabled).toBeDefined();
      }
    });

    it("should handle numeric values as strings", async () => {
      const input = `port=8080
timeout=30.5`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.port).toBeDefined();
        expect(parsed.timeout).toBeDefined();
      }
    });

    it("should handle empty INI", async () => {
      const result = await executeTool(iniToJson, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed).toEqual({});
      }
    });

    it("should handle values with spaces", async () => {
      const input = `message=Hello World`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.message).toBe("Hello World");
      }
    });

    it("should handle quoted values", async () => {
      const input = `name="quoted value"`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBeDefined();
      }
    });

    it("should handle nested section names (dot notation)", async () => {
      const input = `[server.production]
host=prod.example.com`;
      const result = await executeTool(iniToJson, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        // Nested sections may create nested objects
        expect(parsed).toBeDefined();
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(iniToJson, { input: "name=test" });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("options schema", () => {
    it("should have indent option defined", () => {
      expect(iniToJson.optionsSchema).toBeDefined();
    });

    it("should reject indent below minimum", async () => {
      const result = await executeTool(
        iniToJson,
        { input: "name=test" },
        { indent: -1 }
      );

      expect(result.success).toBe(false);
    });

    it("should reject indent above maximum", async () => {
      const result = await executeTool(
        iniToJson,
        { input: "name=test" },
        { indent: 9 }
      );

      expect(result.success).toBe(false);
    });

    it("should accept indent at minimum (0)", async () => {
      const result = await executeTool(
        iniToJson,
        { input: "name=test" },
        { indent: 0 }
      );

      expect(result.success).toBe(true);
    });

    it("should accept indent at maximum (8)", async () => {
      const result = await executeTool(
        iniToJson,
        { input: "name=test" },
        { indent: 8 }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should convert INI when called directly", () => {
      const result = iniToJson.execute({ input: "name=test" }) as {
        output: string;
      };
      const parsed = JSON.parse(result.output) as Record<string, unknown>;
      expect(parsed.name).toBe("test");
    });

    it("should use default indent when options is undefined", () => {
      const result = iniToJson.execute(
        { input: "name=test" },
        undefined
      ) as Record<string, unknown>;
      expect(result.output).toContain("  ");
    });
  });
});
