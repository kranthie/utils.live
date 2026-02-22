import { describe, it, expect } from "vitest";
import { eslintConfigGenerator } from "../../../src/tools/code/eslint-config-generator";
import { executeTool } from "../../../src/core/executor";

describe("eslintConfigGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(eslintConfigGenerator.meta.id).toBe(
        "code/eslint-config-generator"
      );
      expect(eslintConfigGenerator.meta.category).toBe("code");
    });
  });

  describe("execute - flat config", () => {
    it("should generate flat config by default", async () => {
      const result = await executeTool(eslintConfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("import js from '@eslint/js'");
        expect(output).toContain("export default [");
        expect(output).toContain("js.configs.recommended");
      }
    });

    it("should include TypeScript in flat config", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        typescript: true,
        format: "flat",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("typescript-eslint");
        expect(output).toContain("tseslint.configs.recommended");
      }
    });

    it("should include React plugins in flat config", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        framework: "react",
        format: "flat",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("eslint-plugin-react");
        expect(output).toContain("eslint-plugin-react-hooks");
      }
    });

    it("should include Prettier in flat config", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        prettier: true,
        format: "flat",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("eslint-config-prettier");
      }
    });

    it("should apply strict rules", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        style: "strict",
        format: "flat",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain('"no-console": "error"');
      }
    });

    it("should apply relaxed rules", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        style: "relaxed",
        format: "flat",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain('"no-console": "warn"');
      }
    });
  });

  describe("execute - legacy config", () => {
    it("should generate legacy config", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        format: "legacy",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.extends).toContain("eslint:recommended");
      }
    });

    it("should include nextjs config in legacy format", async () => {
      const result = await executeTool(eslintConfigGenerator, {
        framework: "nextjs",
        format: "legacy",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.extends).toContain("next/core-web-vitals");
      }
    });
  });
});
