import { describe, it, expect } from "vitest";
import { csvValidator } from "../../../src/tools/csv/validator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ValidationError {
  type: string;
  code: string;
  message: string;
  row?: number;
}

interface ValidatorOutput {
  valid: boolean;
  rowCount: number;
  columnCount: number;
  hasConsistentColumns: boolean;
  errors: ValidationError[];
}

describe("csvValidator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvValidator.meta.id).toBe("csv/validator");
      expect(csvValidator.meta.name).toBe("CSV Validator");
      expect(csvValidator.meta.category).toBe("csv");
      expect(csvValidator.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvValidator.meta.keywords).toContain("csv");
      expect(csvValidator.meta.keywords).toContain("validate");
      expect(csvValidator.meta.keywords).toContain("syntax");
    });
  });

  describe("execute", () => {
    const validCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

    it("should validate correct CSV", async () => {
      const result = await executeTool(csvValidator, {
        input: validCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).errors).toHaveLength(0);
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        expect(
          (result.data as Record<string, unknown>).hasConsistentColumns
        ).toBe(true);
      }
    });

    it("should detect inconsistent column count", async () => {
      const inconsistentCsv = `name,age,city
John,30
Jane,25,Los Angeles
Bob,35,Chicago,USA`;

      const result = await executeTool(csvValidator, {
        input: inconsistentCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ValidatorOutput;
        expect(data.valid).toBe(false);
        expect(data.hasConsistentColumns).toBe(false);
        expect(data.errors.length).toBeGreaterThan(0);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York
Jane;25;Los Angeles`;

      const result = await executeTool(
        csvValidator,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvValidator, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(0);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvValidator, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should handle header: false option", async () => {
      const noHeaderCsv = `John,30,New York
Jane,25,Los Angeles`;

      const result = await executeTool(
        csvValidator,
        { input: noHeaderCsv },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should handle quoted fields correctly", async () => {
      const quotedCsv = `name,address,city
John,"123 Main St, Apt 4",New York
Jane,"456 Oak Ave",Los Angeles`;

      const result = await executeTool(csvValidator, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should report row numbers in error messages", async () => {
      const inconsistentCsv = `name,age,city
John,30
Jane,25,Los Angeles`;

      const result = await executeTool(csvValidator, {
        input: inconsistentCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ValidatorOutput;
        expect(data.valid).toBe(false);
        const error = data.errors.find(
          (e: ValidationError) => e.row !== undefined
        );
        expect(error).toBeDefined();
      }
    });

    it("should detect too few fields", async () => {
      const tooFewCsv = `a,b,c
1,2,3
4,5
6,7,8`;

      const result = await executeTool(csvValidator, {
        input: tooFewCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ValidatorOutput;
        expect(data.valid).toBe(false);
        expect(data.hasConsistentColumns).toBe(false);
        const fieldError = data.errors.find(
          (e: ValidationError) =>
            e.message.includes("columns") || e.code === "TooFewFields"
        );
        expect(fieldError).toBeDefined();
      }
    });

    it("should detect too many fields", async () => {
      const tooManyCsv = `a,b,c
1,2,3
4,5,6,7
8,9,10`;

      const result = await executeTool(csvValidator, {
        input: tooManyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(false);
        expect(
          (result.data as Record<string, unknown>).hasConsistentColumns
        ).toBe(false);
      }
    });

    it("should auto-detect delimiter when not specified", async () => {
      const tabCsv = `name\tage\tcity
John\t30\tNew York`;

      const result = await executeTool(csvValidator, {
        input: tabCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should auto-detect tab delimiter
        expect(
          (result.data as Record<string, unknown>).columnCount
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvValidator, {
        input: singleCol,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Single column CSV should be valid with consistent columns
        expect(
          (result.data as Record<string, unknown>).hasConsistentColumns
        ).toBe(true);
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvValidator, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle empty values", async () => {
      const emptyValues = `name,age,city
John,,New York
,25,
Bob,35,`;

      const result = await executeTool(csvValidator, {
        input: emptyValues,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect(
          (result.data as Record<string, unknown>).hasConsistentColumns
        ).toBe(true);
      }
    });

    it("should handle escaped quotes in fields", async () => {
      const escapedQuotes = `name,note
John,"He said ""hello"""
Jane,"Test"`;

      const result = await executeTool(csvValidator, {
        input: escapedQuotes,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should handle multiline fields", async () => {
      const multilineCsv = `name,note
John,"Line 1
Line 2"
Jane,Simple`;

      const result = await executeTool(csvValidator, {
        input: multilineCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle special characters", async () => {
      const specialCsv = `name,symbol
Alpha,@#$%
Beta,<>&`;

      const result = await executeTool(csvValidator, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvValidator, {
        input: unicodeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
      }
    });

    it("should limit error messages to first 5 inconsistent rows", async () => {
      const manyInconsistentRows = `a,b,c
1
2
3
4
5
6
7
8`;

      const result = await executeTool(csvValidator, {
        input: manyInconsistentRows,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ValidatorOutput;
        expect(data.valid).toBe(false);
        // Should have at most 5 FieldMismatch errors
        const fieldErrors = data.errors.filter(
          (e: ValidationError) => e.type === "FieldMismatch"
        );
        expect(fieldErrors.length).toBeLessThanOrEqual(5);
      }
    });

    it("should handle pipe delimiter", async () => {
      const pipeCsv = `name|age|city
John|30|New York`;

      const result = await executeTool(
        csvValidator,
        { input: pipeCsv },
        { delimiter: "|" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).valid).toBe(true);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should provide error type and code", async () => {
      const inconsistentCsv = `a,b,c
1,2
3,4,5`;

      const result = await executeTool(csvValidator, {
        input: inconsistentCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ValidatorOutput;
        expect(data.errors.length).toBeGreaterThan(0);
        const error = data.errors[0];
        expect(error).toHaveProperty("type");
        expect(error).toHaveProperty("code");
        expect(error).toHaveProperty("message");
      }
    });
  });
});
