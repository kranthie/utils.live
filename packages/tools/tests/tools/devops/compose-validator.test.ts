import { describe, it, expect } from "vitest";
import { composeValidator } from "../../../src/tools/devops/compose-validator";
import { executeTool } from "../../../src/core/executor";

describe("composeValidator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(composeValidator.meta.id).toBe("devops/compose-validator");
      expect(composeValidator.meta.category).toBe("devops");
    });
  });

  describe("execute", () => {
    it("should validate correct compose file", async () => {
      const result = await executeTool(composeValidator, {
        input: "services:\n  app:\n    image: node:20-alpine\n    ports:\n      - \"3000:3000\"",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Services found: app");
      }
    });

    it("should detect missing services key", async () => {
      const result = await executeTool(composeValidator, {
        input: "something:\n  key: value",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Missing 'services' key");
      }
    });

    it("should warn about :latest tag", async () => {
      const result = await executeTool(composeValidator, {
        input: "services:\n  app:\n    image: node:latest",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Avoid using ':latest'");
      }
    });

    it("should warn about privileged mode", async () => {
      const result = await executeTool(composeValidator, {
        input: "services:\n  app:\n    privileged: true",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("privileged mode");
      }
    });

    it("should warn about outdated version", async () => {
      const result = await executeTool(composeValidator, {
        input: "version: '2'\nservices:\n  app:\n    image: node:20",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("outdated");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(composeValidator, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
