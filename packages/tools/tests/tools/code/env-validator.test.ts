import { describe, it, expect } from "vitest";
import { envValidator } from "../../../src/tools/code/env-validator";
import { executeTool } from "../../../src/core/executor";

describe("envValidator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(envValidator.meta.id).toBe("code/env-validator");
      expect(envValidator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should validate a correct env file", async () => {
      const result = await executeTool(envValidator, {
        input: 'NODE_ENV=development\nAPP_PORT=3000\nAPP_SECRET="my-long-secret-key"',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Variables found: 3");
        expect(output).toContain("Errors: 0");
      }
    });

    it("should detect missing = sign", async () => {
      const result = await executeTool(envValidator, {
        input: "INVALID_LINE",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing '=' sign");
      }
    });

    it("should detect empty key name", async () => {
      const result = await executeTool(envValidator, {
        input: "=value",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Empty key name");
      }
    });

    it("should detect invalid key names", async () => {
      const result = await executeTool(envValidator, {
        input: "invalid-key=value",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Invalid key name");
      }
    });

    it("should detect duplicate keys", async () => {
      const result = await executeTool(envValidator, {
        input: "KEY=value1\nKEY=value2",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Duplicate key");
      }
    });

    it("should warn about unquoted values with spaces", async () => {
      const result = await executeTool(envValidator, {
        input: "KEY=hello world",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("contains spaces but is not quoted");
      }
    });

    it("should detect mismatched quotes", async () => {
      const result = await executeTool(envValidator, {
        input: 'KEY="value',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Mismatched quotes");
      }
    });

    it("should warn about short secret values", async () => {
      const result = await executeTool(envValidator, {
        input: "DB_PASSWORD=abc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("appears to be a secret but has a short value");
      }
    });

    it("should warn about localhost in non-dev keys", async () => {
      const result = await executeTool(envValidator, {
        input: "DATABASE_URL=localhost:5432",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("contains 'localhost'");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(envValidator, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
