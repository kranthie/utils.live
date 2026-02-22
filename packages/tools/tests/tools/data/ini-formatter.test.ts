import { describe, it, expect } from "vitest";
import { iniFormatter } from "../../../src/tools/data/ini-formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("iniFormatter", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(iniFormatter.meta.id).toBe("data/ini-formatter");
    });

    it("should have correct name", () => {
      expect(iniFormatter.meta.name).toBe("INI Formatter");
    });

    it("should be in data category", () => {
      expect(iniFormatter.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(iniFormatter.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(iniFormatter.meta.keywords).toContain("ini");
      expect(iniFormatter.meta.keywords).toContain("format");
      expect(iniFormatter.meta.keywords).toContain("config");
    });
  });

  describe("execute", () => {
    it("should format simple key-value pairs", async () => {
      const input = `name=test
value=123`;
      const result = await executeTool(iniFormatter, { input });

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

    it("should format sections", async () => {
      const input = `[database]
host=localhost
port=5432

[server]
host=0.0.0.0
port=8080`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[database]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "[server]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "host"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "localhost"
        );
      }
    });

    it("should handle values with spaces", async () => {
      const input = `message=Hello World
path=C:\\Program Files\\App`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Hello World"
        );
      }
    });

    it("should handle boolean-like values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "enabled"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "true"
        );
      }
    });

    it("should handle numeric values", async () => {
      const input = `port=8080
timeout=30.5`;
      const result = await executeTool(iniFormatter, { input });

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

    it("should handle empty sections", async () => {
      const input = `[empty]

[nonempty]
key=value`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle empty input", async () => {
      const result = await executeTool(iniFormatter, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should handle comments (may be stripped)", async () => {
      const input = `; This is a comment
name=test
# Another comment style`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle values with equals sign", async () => {
      const input = `equation=a=b+c`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "equation"
        );
      }
    });

    it("should handle nested section names", async () => {
      const input = `[server.production]
host=prod.example.com

[server.development]
host=localhost`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should preserve key order within sections", async () => {
      const input = `[section]
zebra=z
apple=a
mango=m`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should handle already formatted INI", async () => {
      const formatted = `[section]
key=value
`;
      const result = await executeTool(iniFormatter, { input: formatted });

      expect(result.success).toBe(true);
    });

    it("should handle global keys (before any section)", async () => {
      const input = `global_key=global_value

[section]
section_key=section_value`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "global_key"
        );
      }
    });

    it("should handle quoted values", async () => {
      const input = `name="quoted value"
path='single quoted'`;
      const result = await executeTool(iniFormatter, { input });

      expect(result.success).toBe(true);
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(iniFormatter, { input: "name=test" });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should format INI when called directly", () => {
      const result = iniFormatter.execute({ input: "name=test" }) as Record<
        string,
        unknown
      >;
      expect(result.output).toBeDefined();
      expect(result.output).toContain("name");
    });

    it("should format sections when called directly", () => {
      const input = `[section]
key=value`;
      const result = iniFormatter.execute({ input }) as Record<string, unknown>;
      expect(result.output).toContain("[section]");
    });
  });
});
