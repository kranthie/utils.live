import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateInput, validateOptions } from "../../src/core/validator";

describe("validateInput", () => {
  const schema = z.object({
    input: z.string(),
    count: z.number().optional(),
  });

  it("should return success for valid input", () => {
    const result = validateInput(schema, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ input: "hello" });
    }
  });

  it("should return success with optional field", () => {
    const result = validateInput(schema, { input: "hello", count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ input: "hello", count: 5 });
    }
  });

  it("should return error for missing required field", () => {
    const result = validateInput(schema, {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      expect(result.error.field).toBe("input");
    }
  });

  it("should return error for wrong type", () => {
    const result = validateInput(schema, { input: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      expect(result.error.field).toBe("input");
    }
  });

  it("should return error for null input", () => {
    const result = validateInput(schema, null);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_REQUIRED");
    }
  });

  it("should return error for undefined input", () => {
    const result = validateInput(schema, undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_REQUIRED");
    }
  });

  it("should handle validation error without field path", () => {
    // Use a string schema directly - errors on root have empty path
    const stringSchema = z.string();
    const result = validateInput(stringSchema, 123);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      // When path is empty, field should be undefined
      expect(result.error.field).toBeUndefined();
      // Message should not have field prefix
      expect(result.error.message).not.toContain("Invalid :");
    }
  });
});

describe("validateOptions", () => {
  const schema = z.object({
    indent: z.number().min(0).max(8).default(2),
    sortKeys: z.boolean().default(false),
  });

  it("should return defaults when options is undefined", () => {
    const result = validateOptions(schema, undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ indent: 2, sortKeys: false });
    }
  });

  it("should merge provided options with defaults", () => {
    const result = validateOptions(schema, { indent: 4 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ indent: 4, sortKeys: false });
    }
  });

  it("should return error for invalid option value", () => {
    const result = validateOptions(schema, { indent: 10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      expect(result.error.field).toBe("indent");
    }
  });

  it("should succeed when no schema provided", () => {
    const result = validateOptions(undefined, { anything: "goes" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeUndefined();
    }
  });

  it("should handle validation error without field path in options", () => {
    // Use a number schema directly - errors on root have empty path
    const numberSchema = z.number();
    const result = validateOptions(numberSchema, "not a number");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      // When path is empty, field should be undefined
      expect(result.error.field).toBeUndefined();
    }
  });
});
