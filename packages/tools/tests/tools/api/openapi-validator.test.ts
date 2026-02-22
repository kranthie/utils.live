import { describe, it, expect } from "vitest";
import { openapiValidator } from "../../../src/tools/api/openapi-validator";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Validator Tool", () => {
  it("should validate a valid OpenAPI spec", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiValidator, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).errors).toHaveLength(0);
    }
  });

  it("should detect missing required fields", async () => {
    const spec = JSON.stringify({ openapi: "3.0.0" });
    const result = await executeTool(openapiValidator, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        ((result.data as Record<string, unknown>).errors as string[]).join(" ")
      ).toContain("info");
    }
  });

  it("should detect missing openapi version", async () => {
    const spec = JSON.stringify({
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiValidator, { input: spec });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        ((result.data as Record<string, unknown>).errors as string[]).join(" ")
      ).toContain("openapi");
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(openapiValidator, { input: "{invalid" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        ((result.data as Record<string, unknown>).errors as string[]).join(" ")
      ).toContain("Invalid JSON");
    }
  });

  it("should have correct metadata", () => {
    expect(openapiValidator.meta.id).toBe("api/openapi-validator");
  });
});
