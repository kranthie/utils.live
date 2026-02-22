import { describe, it, expect } from "vitest";
import { csvColumnExtractor } from "../../../src/tools/csv/column-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ColumnExtractorOutput {
  output: string;
  extractedColumns: string[];
  rowCount: number;
}

describe("csvColumnExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvColumnExtractor.meta.id).toBe("csv/column-extractor");
      expect(csvColumnExtractor.meta.name).toBe("CSV Column Extractor");
      expect(csvColumnExtractor.meta.category).toBe("csv");
      expect(csvColumnExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvColumnExtractor.meta.keywords).toContain("csv");
      expect(csvColumnExtractor.meta.keywords).toContain("column");
      expect(csvColumnExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

    it("should extract single column by name", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\nJohn\nJane\nBob"
        );
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name"]);
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
      }
    });

    it("should extract multiple columns by name", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "name,city" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name,city\nJohn,New York\nJane,Los Angeles\nBob,Chicago"
        );
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name", "city"]);
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
      }
    });

    it("should extract column by index", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "1" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "age\n30\n25\n35"
        );
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["age"]);
      }
    });

    it("should extract columns with comma-separated string", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "name, age" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name", "age"]);
      }
    });

    it("should handle case-insensitive column names", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "NAME" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name"]);
      }
    });

    it("should exclude header when includeHeader is false", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "name", includeHeader: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "John\nJane\nBob"
        );
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York
Jane;25;Los Angeles`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: semicolonCsv },
        { columns: "name", delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\nJohn\nJane"
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvColumnExtractor, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual([]);
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should return error for non-existent columns", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "nonexistent" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("CSV_PARSE_ERROR");
        expect(result.error.message).toContain("No matching columns");
      }
    });

    it("should handle quoted fields with commas", async () => {
      const quotedCsv = `name,address,city
"John, Jr.",123 Main St,New York
Jane,"456 Oak Ave, Apt 2",Chicago`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: quotedCsv },
        { columns: "address" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "123 Main St"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          '"456 Oak Ave, Apt 2"'
        );
      }
    });

    it("should handle quoted fields with quotes inside", async () => {
      const quotedCsv = `name,comment
John,"He said ""hello"""
Jane,"Test"`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: quotedCsv },
        { columns: "comment" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // After parsing, quotes are unescaped, then re-escaped on output
        expect((result.data as Record<string, unknown>).output).toContain(
          "hello"
        );
      }
    });

    it("should handle multiline fields", async () => {
      const multilineCsv = `name,notes
John,"Line1
Line2"
Jane,Simple`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: multilineCsv },
        { columns: "notes" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["notes"]);
      }
    });

    it("should handle mixed index and name extraction", async () => {
      const result = await executeTool(
        csvColumnExtractor,
        { input: basicCsv },
        { columns: "0,city" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name", "city"]);
      }
    });

    it("should extract first column by default", async () => {
      const result = await executeTool(csvColumnExtractor, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\nJohn\nJane\nBob"
        );
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["name"]);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single row with header", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: singleRow },
        { columns: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\nJohn"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle header only CSV", async () => {
      const headerOnly = "name,age,city";

      const result = await executeTool(
        csvColumnExtractor,
        { input: headerOnly },
        { columns: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("name");
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should handle empty values", async () => {
      const emptyValuesCsv = `name,age,city
John,,New York
,25,
Bob,35,Chicago`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: emptyValuesCsv },
        { columns: "name,age" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ColumnExtractorOutput;
        const lines = data.output.split("\n");
        expect(lines).toHaveLength(4);
        expect(lines[1]).toBe("John,");
        expect(lines[2]).toBe(",25");
      }
    });

    it("should handle whitespace in column names", async () => {
      const spacedCsv = `first name,last name,age
John,Doe,30`;

      const result = await executeTool(
        csvColumnExtractor,
        { input: spacedCsv },
        { columns: "first name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).extractedColumns
        ).toEqual(["first name"]);
      }
    });
  });
});
