import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateOptions } from "../../src/core/validator";
import { INPUT_INVALID_TYPE } from "../../src/core/error-codes";

describe("validateOptions", () => {
  const optionsSchema = z.object({
    indent: z.number().int().min(0).max(8).default(2),
    sortKeys: z.boolean().default(false),
  });

  describe("with valid options", () => {
    it("should parse complete options", () => {
      const result = validateOptions(optionsSchema, {
        indent: 4,
        sortKeys: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ indent: 4, sortKeys: true });
      }
    });

    it("should apply defaults for missing options", () => {
      const result = validateOptions(optionsSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ indent: 2, sortKeys: false });
      }
    });

    it("should apply defaults when options is undefined", () => {
      const result = validateOptions(optionsSchema, undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ indent: 2, sortKeys: false });
      }
    });

    it("should apply partial defaults", () => {
      const result = validateOptions(optionsSchema, { indent: 6 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ indent: 6, sortKeys: false });
      }
    });
  });

  describe("with invalid options", () => {
    it("should reject invalid type", () => {
      const result = validateOptions(optionsSchema, { indent: "four" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(INPUT_INVALID_TYPE);
        expect(result.error.field).toBe("indent");
      }
    });

    it("should reject out-of-range values", () => {
      const result = validateOptions(optionsSchema, { indent: 10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(INPUT_INVALID_TYPE);
      }
    });

    it("should reject negative values", () => {
      const result = validateOptions(optionsSchema, { indent: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(INPUT_INVALID_TYPE);
      }
    });
  });

  describe("without schema", () => {
    it("should return undefined when no schema provided", () => {
      const result = validateOptions(undefined, { anything: "goes" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe("with select/enum options", () => {
    const selectSchema = z.object({
      format: z.enum(["compact", "expanded", "minified"]).default("expanded"),
    });

    it("should accept valid enum values", () => {
      const result = validateOptions(selectSchema, { format: "compact" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ format: "compact" });
      }
    });

    it("should apply default enum value", () => {
      const result = validateOptions(selectSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ format: "expanded" });
      }
    });

    it("should reject invalid enum values", () => {
      const result = validateOptions(selectSchema, { format: "invalid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(INPUT_INVALID_TYPE);
      }
    });
  });

  describe("with optional options", () => {
    const optionalSchema = z.object({
      title: z.string().optional(),
      count: z.number().optional(),
    });

    it("should allow omitted optional values", () => {
      const result = validateOptions(optionalSchema, {});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("should accept provided optional values", () => {
      const result = validateOptions(optionalSchema, { title: "Test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ title: "Test" });
      }
    });
  });
});
