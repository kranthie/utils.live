import { describe, it, expect } from "vitest";
import { iniValidator } from "../../../src/tools/data/ini-validator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("iniValidator", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(iniValidator.meta.id).toBe("data/ini-validator");
    });

    it("should have correct name", () => {
      expect(iniValidator.meta.name).toBe("INI Validator");
    });

    it("should be in data category", () => {
      expect(iniValidator.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(iniValidator.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(iniValidator.meta.keywords).toContain("ini");
      expect(iniValidator.meta.keywords).toContain("validate");
      expect(iniValidator.meta.keywords).toContain("config");
    });
  });

  describe("execute - valid INI", () => {
    it("should validate simple key-value pairs", async () => {
      const input = `name=test
value=123`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).error).toBeUndefined();
      }
    });

    it("should validate empty INI", async () => {
      const result = await executeTool(iniValidator, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(0);
        expect((result.data as Record<string, unknown>).keyCount).toBe(0);
      }
    });

    it("should validate sections and count them", async () => {
      const input = `[database]
host=localhost

[server]
port=8080`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(2);
      }
    });

    it("should count keys correctly", async () => {
      const input = `[section]
key1=value1
key2=value2
key3=value3`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).keyCount).toBe(3);
      }
    });

    it("should count global keys", async () => {
      const input = `global1=value1
global2=value2`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).keyCount).toBe(2);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(0);
      }
    });

    it("should count keys across sections", async () => {
      const input = `[section1]
key1=value1
key2=value2

[section2]
key3=value3`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(2);
        expect((result.data as Record<string, unknown>).keyCount).toBe(3);
      }
    });

    it("should count mixed global and section keys", async () => {
      const input = `global=value

[section]
local=value`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(1);
        expect((result.data as Record<string, unknown>).keyCount).toBe(2);
      }
    });

    it("should validate comments", async () => {
      const input = `; This is a comment
name=test
# Another comment`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate values with spaces", async () => {
      const input = `message=Hello World`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate boolean-like values", async () => {
      const input = `enabled=true
disabled=false`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate numeric values", async () => {
      const input = `port=8080
timeout=30.5`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate nested section names", async () => {
      const input = `[server.production]
host=prod.example.com`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should validate empty section", async () => {
      const input = `[empty]

[nonempty]
key=value`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });
  });

  describe("section and key counting edge cases", () => {
    it("should handle only sections with no keys", async () => {
      const input = `[section1]

[section2]
`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(2);
        expect((result.data as Record<string, unknown>).keyCount).toBe(0);
      }
    });

    it("should handle single section single key", async () => {
      const input = `[section]
key=value`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(1);
        expect((result.data as Record<string, unknown>).keyCount).toBe(1);
      }
    });

    it("should handle many sections", async () => {
      const input = `[section1]
key1=value1

[section2]
key2=value2

[section3]
key3=value3

[section4]
key4=value4

[section5]
key5=value5`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).sectionCount).toBe(5);
        expect((result.data as Record<string, unknown>).keyCount).toBe(5);
      }
    });
  });

  describe("strict validation warnings", () => {
    it("should warn about duplicate sections", async () => {
      const input = `[section]
key1=value1

[section]
key2=value2`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.valid).toBe(true);
        expect(data.warnings).toBeDefined();
        expect(
          (data.warnings as string[]).some((w: string) =>
            w.includes("Duplicate section")
          )
        ).toBe(true);
      }
    });

    it("should warn about duplicate keys in same section", async () => {
      const input = `[section]
key=value1
key=value2`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.valid).toBe(true);
        expect(data.warnings).toBeDefined();
        expect(
          (data.warnings as string[]).some((w: string) =>
            w.includes("Duplicate key")
          )
        ).toBe(true);
      }
    });

    it("should warn about duplicate global keys", async () => {
      const input = `key=value1
key=value2`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.valid).toBe(true);
        expect(data.warnings).toBeDefined();
        expect(
          (data.warnings as string[]).some((w: string) =>
            w.includes("Duplicate key")
          )
        ).toBe(true);
      }
    });

    it("should not include warnings when INI is clean", async () => {
      const input = `[section]
key1=value1
key2=value2`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.valid).toBe(true);
        expect(data.warnings).toBeUndefined();
      }
    });

    it("should warn about lines without equals sign", async () => {
      const input = `[section]
key=value
badline`;
      const result = await executeTool(iniValidator, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.warnings).toBeDefined();
        expect(
          (data.warnings as string[]).some((w: string) =>
            w.includes("not a valid")
          )
        ).toBe(true);
      }
    });
  });

  describe("execution metadata", () => {
    it("should include execution metadata", async () => {
      const result = await executeTool(iniValidator, { input: "name=test" });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should validate INI when called directly", () => {
      const result = iniValidator.execute({ input: "name=test" }) as Record<
        string,
        unknown
      >;
      expect(result.valid).toBe(true);
      expect(result.keyCount).toBe(1);
    });

    it("should return section and key counts", () => {
      const input = `[section]
key1=value1
key2=value2`;
      const result = iniValidator.execute({ input }) as Record<string, unknown>;
      expect(result.valid).toBe(true);
      expect(result.sectionCount).toBe(1);
      expect(result.keyCount).toBe(2);
    });

    it("should handle empty input", () => {
      const result = iniValidator.execute({ input: "" }) as Record<
        string,
        unknown
      >;
      expect(result.valid).toBe(true);
      expect(result.sectionCount).toBe(0);
      expect(result.keyCount).toBe(0);
    });
  });
});
