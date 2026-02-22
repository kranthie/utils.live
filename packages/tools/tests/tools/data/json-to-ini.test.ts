import { describe, it, expect } from "vitest";
import { jsonToIni } from "../../../src/tools/data/json-to-ini";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("jsonToIni", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(jsonToIni.meta.id).toBe("data/json-to-ini");
    });

    it("should have correct name", () => {
      expect(jsonToIni.meta.name).toBe("JSON to INI");
    });

    it("should be in data category", () => {
      expect(jsonToIni.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(jsonToIni.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(jsonToIni.meta.keywords).toContain("json");
      expect(jsonToIni.meta.keywords).toContain("ini");
      expect(jsonToIni.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple JSON object to INI", async () => {
      const input = JSON.stringify({ name: "test", value: 123 });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "test"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "value"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "123"
        );
      }
    });

    it("should convert nested objects to INI sections", async () => {
      const input = JSON.stringify({
        database: {
          host: "localhost",
          port: 5432,
        },
      });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[database]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "host"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "localhost"
        );
      }
    });

    it("should convert multiple nested objects", async () => {
      const input = JSON.stringify({
        database: { host: "localhost" },
        server: { port: 8080 },
      });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[database]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[server]"
        );
      }
    });

    it("should handle boolean values", async () => {
      const input = JSON.stringify({ enabled: true, disabled: false });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "enabled"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "disabled"
        );
      }
    });

    it("should handle numeric values", async () => {
      const input = JSON.stringify({ port: 8080, timeout: 30.5 });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "port"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "8080"
        );
      }
    });

    it("should handle string values with spaces", async () => {
      const input = JSON.stringify({ message: "Hello World" });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "message"
        );
      }
    });

    it("should handle null values", async () => {
      const input = JSON.stringify({ nullValue: null });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
    });

    it("should handle empty object", async () => {
      const input = JSON.stringify({});
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should return error for array at root level", async () => {
      const input = JSON.stringify([1, 2, 3]);
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
        expect(result.error.message).toContain("object at the root level");
      }
    });

    it("should return error for primitive at root level - string", async () => {
      const input = JSON.stringify("string");
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for primitive at root level - number", async () => {
      const input = JSON.stringify(42);
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for null at root level", async () => {
      const input = JSON.stringify(null);
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for invalid JSON", async () => {
      const result = await executeTool(jsonToIni, { input: "not valid json" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should return error for malformed JSON", async () => {
      const result = await executeTool(jsonToIni, { input: '{"key":}' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSON_PARSE_ERROR");
      }
    });

    it("should handle deeply nested objects", async () => {
      const input = JSON.stringify({
        level1: {
          level2: {
            level3: {
              key: "value",
            },
          },
        },
      });
      const result = await executeTool(jsonToIni, { input });

      expect(result.success).toBe(true);
    });

    it("should handle arrays within objects (may flatten)", async () => {
      const input = JSON.stringify({
        tags: ["one", "two", "three"],
      });
      const result = await executeTool(jsonToIni, { input });

      // Arrays in INI format may be handled differently by the parser
      expect(result.success).toBe(true);
    });

    it("should include execution metadata", async () => {
      const input = JSON.stringify({ name: "test" });
      const result = await executeTool(jsonToIni, { input });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should convert JSON when called directly", () => {
      const input = JSON.stringify({ name: "test" });
      const result = jsonToIni.execute({ input }) as Record<string, unknown>;
      expect(result.output).toBeDefined();
      expect(result.output).toContain("name");
    });

    it("should throw error for array at root level", () => {
      expect(() => jsonToIni.execute({ input: "[1, 2, 3]" })).toThrow();
    });

    it("should throw error for invalid JSON", () => {
      expect(() => jsonToIni.execute({ input: "invalid" })).toThrow();
    });
  });
});
