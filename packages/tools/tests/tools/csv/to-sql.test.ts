import { describe, it, expect } from "vitest";
import { csvToSql } from "../../../src/tools/csv/to-sql";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToSqlOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvToSql", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToSql.meta.id).toBe("csv/to-sql");
      expect(csvToSql.meta.name).toBe("CSV to SQL");
      expect(csvToSql.meta.category).toBe("csv");
      expect(csvToSql.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToSql.meta.keywords).toContain("csv");
      expect(csvToSql.meta.keywords).toContain("sql");
      expect(csvToSql.meta.keywords).toContain("database");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to SQL with CREATE TABLE and INSERT", async () => {
      const result = await executeTool(csvToSql, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "CREATE TABLE"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "INSERT INTO"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "data"
        ); // default table name
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should use custom table name", async () => {
      const result = await executeTool(
        csvToSql,
        { input: basicCsv },
        { tableName: "users" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "CREATE TABLE `users`"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "INSERT INTO `users`"
        );
      }
    });

    it("should exclude CREATE TABLE when includeCreate is false", async () => {
      const result = await executeTool(
        csvToSql,
        { input: basicCsv },
        { includeCreate: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "CREATE TABLE"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "INSERT INTO"
        );
      }
    });

    it("should infer INTEGER type for integer columns", async () => {
      const intCsv = `id,count
1,100
2,200`;

      const result = await executeTool(csvToSql, {
        input: intCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "INTEGER"
        );
      }
    });

    it("should infer REAL type for decimal columns", async () => {
      const decimalCsv = `id,price
1,19.99
2,29.50`;

      const result = await executeTool(csvToSql, {
        input: decimalCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "REAL"
        );
      }
    });

    it("should infer VARCHAR type for short text columns", async () => {
      const textCsv = `name,code
John,ABC
Jane,XYZ`;

      const result = await executeTool(csvToSql, {
        input: textCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "VARCHAR"
        );
      }
    });

    it("should infer TEXT type for long text columns", async () => {
      const longTextCsv = `name,description
John,${"a".repeat(300)}`;

      const result = await executeTool(csvToSql, {
        input: longTextCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "TEXT"
        );
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30
Jane;25`;

      const result = await executeTool(
        csvToSql,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "INSERT INTO"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
      }
    });

    it("should batch INSERT statements", async () => {
      // Create CSV with many rows
      const rows = Array.from({ length: 150 }, (_, i) => `Name${i},${i}`);
      const largeCsv = `name,value\n${rows.join("\n")}`;

      const result = await executeTool(
        csvToSql,
        { input: largeCsv },
        { batchSize: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have multiple INSERT statements
        const data = result.data as ToSqlOutput;
        const insertCount = (data.output.match(/INSERT INTO/g) ?? []).length;
        expect(insertCount).toBe(3); // 150 rows / 50 batch = 3 batches
      }
    });

    it("should escape single quotes in values", async () => {
      const quotesCsv = `name,note
John,It's a test
Jane,He said 'hello'`;

      const result = await executeTool(csvToSql, {
        input: quotesCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "It''s"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "''hello''"
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToSql, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToSql, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should sanitize column names with special characters", async () => {
      const specialCsv = `first name,last-name,user@email
John,Doe,john@test.com`;

      const result = await executeTool(csvToSql, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "first_name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "last_name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "user_email"
        );
      }
    });

    it("should output numbers without quotes", async () => {
      const numericCsv = `id,value
1,100
2,200`;

      const result = await executeTool(csvToSql, {
        input: numericCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Numbers should not be quoted
        expect((result.data as Record<string, unknown>).output).toMatch(
          /\(1, 100\)/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /\(2, 200\)/
        );
      }
    });

    it("should output strings with quotes", async () => {
      const result = await executeTool(csvToSql, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "'John'"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "'New York'"
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToSql, {
        input: singleCol,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name VARCHAR"
        );
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToSql, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle empty values", async () => {
      const emptyCsv = `name,age
John,
,25`;

      const result = await executeTool(csvToSql, {
        input: emptyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("''");
      }
    });

    it("should handle quoted fields with commas", async () => {
      const quotedCsv = `name,address
John,"123 Main St, Apt 4"`;

      const result = await executeTool(csvToSql, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "123 Main St, Apt 4"
        );
      }
    });

    it("should handle negative numbers", async () => {
      const negativeCsv = `name,value
A,-100
B,-50`;

      const result = await executeTool(csvToSql, {
        input: negativeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "-100"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "-50"
        );
      }
    });

    it("should infer TEXT for all-empty columns", async () => {
      const emptyColCsv = `name,empty
John,
Jane,`;

      const result = await executeTool(csvToSql, {
        input: emptyColCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "empty TEXT"
        );
      }
    });

    it("should handle very long column names", async () => {
      const longName = "a".repeat(100);
      const longNameCsv = `${longName},value
test,123`;

      const result = await executeTool(csvToSql, {
        input: longNameCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          longName
        );
      }
    });

    it("should produce valid SQL syntax", async () => {
      const result = await executeTool(csvToSql, {
        input: `name,age
John,30
Jane,25`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check basic SQL syntax elements
        expect((result.data as Record<string, unknown>).output).toMatch(
          /CREATE TABLE `\w+` \(/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /INSERT INTO `\w+` \(/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /VALUES/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(/;/);
      }
    });
  });
});
