import { describe, it, expect } from "vitest";
import { babelConfigGenerator } from "../../../src/tools/code/babel-config-generator";
import { executeTool } from "../../../src/core/executor";

describe("babelConfigGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(babelConfigGenerator.meta.id).toBe("code/babel-config-generator");
      expect(babelConfigGenerator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should generate default config in JSON format", async () => {
      const result = await executeTool(babelConfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const output = data.output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        expect(parsed.presets).toBeDefined();
        expect((parsed.presets as unknown[][])[0][0]).toBe("@babel/preset-env");
      }
    });

    it("should include TypeScript preset when typescript is true", async () => {
      const result = await executeTool(babelConfigGenerator, {
        typescript: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("@babel/preset-typescript");
      }
    });

    it("should include React preset when react is true", async () => {
      const result = await executeTool(babelConfigGenerator, {
        react: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("@babel/preset-react");
        expect(output).toContain("automatic");
      }
    });

    it("should include decorator plugins when decorators is true", async () => {
      const result = await executeTool(babelConfigGenerator, {
        decorators: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("@babel/plugin-proposal-decorators");
        expect(output).toContain("@babel/plugin-proposal-class-properties");
      }
    });

    it("should target node when env is node", async () => {
      const result = await executeTool(babelConfigGenerator, { env: "node" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("current");
      }
    });

    it("should output JS format when format is js", async () => {
      const result = await executeTool(babelConfigGenerator, { format: "js" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("module.exports =");
      }
    });

    it("should set modules to commonjs when specified", async () => {
      const result = await executeTool(babelConfigGenerator, {
        modules: "commonjs",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("commonjs");
      }
    });

    it("should set modules to false when specified", async () => {
      const result = await executeTool(babelConfigGenerator, {
        modules: "false",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const presets = parsed.presets as unknown[][];
        const envOpts = presets[0][1] as Record<string, unknown>;
        expect(envOpts.modules).toBe(false);
      }
    });
  });
});
