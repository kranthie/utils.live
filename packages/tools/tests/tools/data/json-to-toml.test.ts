import { describe, it, expect } from "vitest";
import { jsonToToml } from "../../../src/tools/data/json-to-toml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonToToml", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(jsonToToml.meta.id).toBe("data/json-to-toml");
    });

    it("should have correct name", () => {
      expect(jsonToToml.meta.name).toBe("JSON to TOML");
    });

    it("should be in data category", () => {
      expect(jsonToToml.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(jsonToToml.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(jsonToToml.meta.keywords).toContain("json");
      expect(jsonToToml.meta.keywords).toContain("toml");
      expect(jsonToToml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple JSON object to TOML", async () => {
      const input = JSON.stringify({ name: "test", value: 123 });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("name");
        expect(data.output).toContain("test");
        expect(data.output).toContain("value");
        expect(data.output).toContain("123");
      }
    });

    it("should convert nested objects to TOML tables", async () => {
      const input = JSON.stringify({
        server: {
          host: "localhost",
          port: 8080,
        },
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("[server]");
        expect(data.output).toContain("host");
        expect(data.output).toContain("localhost");
        expect(data.output).toContain("port");
        // TOML library may format numbers with underscores (8_080)
        expect(data.output).toMatch(/8.?0.?8.?0/);
      }
    });

    it("should convert deeply nested objects", async () => {
      const input = JSON.stringify({
        server: {
          ssl: {
            enabled: true,
            cert: "cert.pem",
          },
        },
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("ssl");
        expect(data.output).toContain("enabled");
        expect(data.output).toContain("true");
      }
    });

    it("should convert arrays to TOML arrays", async () => {
      const input = JSON.stringify({
        numbers: [1, 2, 3],
        names: ["alice", "bob"],
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("numbers");
        expect(data.output).toContain("names");
      }
    });

    it("should convert array of objects to TOML array of tables", async () => {
      const input = JSON.stringify({
        products: [
          { name: "Hammer", price: 9.99 },
          { name: "Nail", price: 0.05 },
        ],
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("[[products]]");
        expect(data.output).toContain("Hammer");
        expect(data.output).toContain("Nail");
      }
    });

    it("should handle boolean values", async () => {
      const input = JSON.stringify({ enabled: true, disabled: false });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("enabled");
        expect(data.output).toContain("true");
        expect(data.output).toContain("disabled");
        expect(data.output).toContain("false");
      }
    });

    it("should handle numeric values", async () => {
      const input = JSON.stringify({
        port: 8080,
        pi: 3.14159,
        negative: -42,
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("port");
        // TOML library may format numbers with underscores (8_080)
        expect(data.output).toMatch(/8.?0.?8.?0/);
        expect(data.output).toContain("pi");
      }
    });

    it("should handle string values", async () => {
      const input = JSON.stringify({ message: "Hello, World!" });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("message");
        expect(data.output).toContain("Hello, World!");
      }
    });

    it("should handle empty object", async () => {
      const input = JSON.stringify({});
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output.trim()).toBe("");
      }
    });

    it("should return error for array at root level", async () => {
      const input = JSON.stringify([1, 2, 3]);
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
        expect(result.error.message).toContain("object at the root level");
      }
    });

    it("should return error for primitive at root level - string", async () => {
      const input = JSON.stringify("string");
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for primitive at root level - number", async () => {
      const input = JSON.stringify(42);
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for null at root level", async () => {
      const input = JSON.stringify(null);
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for invalid JSON", async () => {
      const result = await executeTool(jsonToToml, { input: "not valid json" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for malformed JSON", async () => {
      const result = await executeTool(jsonToToml, { input: '{"key":}' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should handle multiple sections", async () => {
      const input = JSON.stringify({
        database: { host: "localhost", port: 5432 },
        server: { host: "0.0.0.0", port: 8080 },
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("[database]");
        expect(data.output).toContain("[server]");
      }
    });

    it("should handle mixed top-level and nested values", async () => {
      const input = JSON.stringify({
        title: "My App",
        version: "1.0.0",
        database: {
          host: "localhost",
        },
      });
      const result = await executeTool(jsonToToml, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        expect(data.output).toContain("title");
        expect(data.output).toContain("version");
        expect(data.output).toContain("[database]");
      }
    });

    it("should include execution metadata", async () => {
      const input = JSON.stringify({ name: "test" });
      const result = await executeTool(jsonToToml, { input });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should convert JSON when called directly", () => {
      const input = JSON.stringify({ name: "test" });
      const result = jsonToToml.execute({ input }) as Record<string, unknown>;
      expect(result.output).toBeDefined();
      expect(result.output).toContain("name");
    });

    it("should throw error for array at root level", () => {
      expect(() => jsonToToml.execute({ input: "[1, 2, 3]" })).toThrow();
    });

    it("should throw error for invalid JSON", () => {
      expect(() => jsonToToml.execute({ input: "invalid" })).toThrow();
    });
  });
});
