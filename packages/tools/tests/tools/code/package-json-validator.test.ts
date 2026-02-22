import { describe, it, expect } from "vitest";
import { packageJsonValidator } from "../../../src/tools/code/package-json-validator";
import { executeTool } from "../../../src/core/executor";

describe("packageJsonValidator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(packageJsonValidator.meta.id).toBe("code/package-json-validator");
      expect(packageJsonValidator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should validate a correct package.json", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: JSON.stringify({
          name: "my-app",
          version: "1.0.0",
          description: "Test app",
          license: "MIT",
          repository: "https://github.com/user/repo",
          keywords: ["test"],
        }),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Errors: 0");
        expect(output).toContain("package.json is valid!");
      }
    });

    it("should detect missing name", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"version": "1.0.0"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing required field 'name'");
      }
    });

    it("should detect missing version", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "test"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing required field 'version'");
      }
    });

    it("should detect uppercase in name", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "MyApp", "version": "1.0.0"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("must not contain uppercase");
      }
    });

    it("should detect spaces in name", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "my app", "version": "1.0.0"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("must not contain spaces");
      }
    });

    it("should detect invalid version format", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "test", "version": "abc"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("must follow semver");
      }
    });

    it("should warn about missing optional fields", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "test", "version": "1.0.0"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing 'description'");
        expect(output).toContain("Missing 'license'");
      }
    });

    it("should show scripts info", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: '{"name": "test", "version": "1.0.0", "scripts": {"build": "tsc", "test": "vitest"}}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Scripts: build, test");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(packageJsonValidator, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid JSON", async () => {
      const result = await executeTool(packageJsonValidator, {
        input: "not json",
      });
      expect(result.success).toBe(false);
    });
  });
});
