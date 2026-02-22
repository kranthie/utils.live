import { describe, it, expect } from "vitest";
import { prettierConfigGenerator } from "../../../src/tools/code/prettier-config-generator";
import { executeTool } from "../../../src/core/executor";

describe("prettierConfigGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(prettierConfigGenerator.meta.id).toBe(
        "code/prettier-config-generator"
      );
      expect(prettierConfigGenerator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should generate default JSON config", async () => {
      const result = await executeTool(prettierConfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.printWidth).toBe(80);
        expect(parsed.tabWidth).toBe(2);
        expect(parsed.semi).toBe(true);
      }
    });

    it("should generate JS format config", async () => {
      const result = await executeTool(prettierConfigGenerator, {
        format: "js",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("module.exports =");
        expect(output).toContain("@type");
      }
    });

    it("should generate YAML format config", async () => {
      const result = await executeTool(prettierConfigGenerator, {
        format: "yaml",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("printWidth:");
        expect(output).toContain("tabWidth:");
      }
    });

    it("should respect custom options", async () => {
      const result = await executeTool(prettierConfigGenerator, {
        printWidth: 120,
        tabWidth: 4,
        useTabs: true,
        semi: false,
        singleQuote: true,
        trailingComma: "none",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.printWidth).toBe(120);
        expect(parsed.tabWidth).toBe(4);
        expect(parsed.useTabs).toBe(true);
        expect(parsed.semi).toBe(false);
        expect(parsed.singleQuote).toBe(true);
        expect(parsed.trailingComma).toBe("none");
      }
    });
  });
});
