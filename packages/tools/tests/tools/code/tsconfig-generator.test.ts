import { describe, it, expect } from "vitest";
import { tsconfigGenerator } from "../../../src/tools/code/tsconfig-generator";
import { executeTool } from "../../../src/core/executor";

describe("tsconfigGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(tsconfigGenerator.meta.id).toBe("code/tsconfig-generator");
      expect(tsconfigGenerator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should generate default tsconfig", async () => {
      const result = await executeTool(tsconfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.target).toBe("ES2022");
        expect(compilerOptions.module).toBe("ESNext");
        expect(compilerOptions.strict).toBe(true);
      }
    });

    it("should generate Next.js config", async () => {
      const result = await executeTool(tsconfigGenerator, {
        framework: "nextjs",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.jsx).toBe("preserve");
        expect(compilerOptions.incremental).toBe(true);
        expect(parsed.include).toContain("next-env.d.ts");
      }
    });

    it("should generate React config", async () => {
      const result = await executeTool(tsconfigGenerator, {
        framework: "react",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.jsx).toBe("react-jsx");
      }
    });

    it("should generate Node config", async () => {
      const result = await executeTool(tsconfigGenerator, {
        framework: "node",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.module).toBe("NodeNext");
        expect(compilerOptions.moduleResolution).toBe("NodeNext");
      }
    });

    it("should generate library config", async () => {
      const result = await executeTool(tsconfigGenerator, {
        framework: "library",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.declaration).toBe(true);
        expect(compilerOptions.declarationMap).toBe(true);
        expect(parsed.exclude).toContain("**/*.test.ts");
      }
    });

    it("should include path aliases when paths is true", async () => {
      const result = await executeTool(tsconfigGenerator, { paths: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.baseUrl).toBe(".");
        expect(compilerOptions.paths).toBeDefined();
      }
    });

    it("should include declaration files when declared", async () => {
      const result = await executeTool(tsconfigGenerator, {
        declaration: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.declaration).toBe(true);
      }
    });

    it("should disable strict mode", async () => {
      const result = await executeTool(tsconfigGenerator, { strict: false });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as Record<string, unknown>;
        const compilerOptions = parsed.compilerOptions as Record<
          string,
          unknown
        >;
        expect(compilerOptions.strict).toBeUndefined();
      }
    });
  });
});
