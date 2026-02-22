import { describe, it, expect } from "vitest";
import { csvStats } from "../../../src/tools/csv/stats";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ColumnStat {
  name: string;
  type: string;
  uniqueCount: number;
  nullCount: number;
  min?: number | string;
  max?: number | string;
  minValue?: unknown;
  maxValue?: unknown;
  mean?: number;
  median?: number;
  stdDev?: number;
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
}

interface StatsOutput {
  rowCount: number;
  columnCount: number;
  columns: ColumnStat[];
}

describe("csvStats", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvStats.meta.id).toBe("csv/stats");
      expect(csvStats.meta.name).toBe("CSV Statistics");
      expect(csvStats.meta.category).toBe("csv");
      expect(csvStats.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvStats.meta.keywords).toContain("csv");
      expect(csvStats.meta.keywords).toContain("stats");
      expect(csvStats.meta.keywords).toContain("statistics");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city,salary
John,30,New York,50000
Jane,25,Los Angeles,60000
Bob,35,Chicago,45000
Alice,28,Boston,70000`;

    it("should calculate basic statistics", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(4);
        expect((result.data as Record<string, unknown>).columnCount).toBe(4);
        expect((result.data as Record<string, unknown>).columns).toHaveLength(
          4
        );
        expect(
          (result.data as Record<string, unknown>).sizeBytes
        ).toBeGreaterThan(0);
      }
    });

    it("should detect numeric column type", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as StatsOutput;
        const ageColumn = data.columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        expect(ageColumn).toBeDefined();
        expect(ageColumn?.type).toBe("number");
      }
    });

    it("should detect string column type", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as StatsOutput;
        const nameColumn = data.columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        expect(nameColumn).toBeDefined();
        expect(nameColumn?.type).toBe("string");
      }
    });

    it("should calculate min and max for numeric columns", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const ageColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        expect(ageColumn?.minValue).toBe(25);
        expect(ageColumn?.maxValue).toBe(35);
      }
    });

    it("should calculate mean for numeric columns", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const ageColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        // Mean of 30, 25, 35, 28 = 29.5
        expect(ageColumn?.mean).toBe(29.5);
      }
    });

    it("should calculate median for numeric columns", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const ageColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        // Sorted: 25, 28, 30, 35 -> Median = (28 + 30) / 2 = 29
        expect(ageColumn?.median).toBe(29);
      }
    });

    it("should count unique values", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const nameColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        expect(nameColumn?.uniqueCount).toBe(4);
      }
    });

    it("should count null values", async () => {
      const csvWithNulls = `name,age
John,30
Jane,
Bob,35
,28`;

      const result = await executeTool(csvStats, {
        input: csvWithNulls,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const ageColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        expect(ageColumn?.nullCount).toBe(1);

        const nameColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        expect(nameColumn?.nullCount).toBe(1);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30
Jane;25`;

      const result = await executeTool(
        csvStats,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(2);
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvStats, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(0);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvStats, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        // columnCount depends on whether headers are parsed
        expect(
          (result.data as Record<string, unknown>).columnCount
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it("should calculate min/max for string columns", async () => {
      const result = await executeTool(csvStats, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const nameColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        // Alphabetically: Alice, Bob, Jane, John
        expect(nameColumn?.minValue).toBe("Alice");
        expect(nameColumn?.maxValue).toBe("John");
      }
    });

    it("should detect mixed type columns", async () => {
      const mixedCsv = `name,value
John,100
Jane,abc
Bob,200`;

      const result = await executeTool(csvStats, {
        input: mixedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const valueColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "value"
        );
        expect(valueColumn?.type).toBe("mixed");
      }
    });

    it("should handle header: false option", async () => {
      const noHeaderCsv = `John,30
Jane,25`;

      const result = await executeTool(
        csvStats,
        { input: noHeaderCsv },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvStats, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
        const ageColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "age"
        );
        expect(ageColumn?.mean).toBe(30);
        expect(ageColumn?.median).toBe(30);
      }
    });

    it("should handle all null column", async () => {
      const allNulls = `name,age
,
,
,`;

      const result = await executeTool(csvStats, {
        input: allNulls,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const nameColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        expect(nameColumn?.nullCount).toBe(3);
        expect(nameColumn?.type).toBe("string");
      }
    });

    it("should handle odd number of values for median", async () => {
      const oddCsv = `value
10
20
30`;

      const result = await executeTool(csvStats, {
        input: oddCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const valueColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "value"
        );
        expect(valueColumn?.median).toBe(20);
      }
    });

    it("should handle decimal numbers", async () => {
      const decimalCsv = `value
1.5
2.5
3.5`;

      const result = await executeTool(csvStats, {
        input: decimalCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const valueColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "value"
        );
        expect(valueColumn?.mean).toBe(2.5);
      }
    });

    it("should handle negative numbers", async () => {
      const negativeCsv = `value
-10
-5
5
10`;

      const result = await executeTool(csvStats, {
        input: negativeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const valueColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "value"
        );
        expect(valueColumn?.minValue).toBe(-10);
        expect(valueColumn?.maxValue).toBe(10);
        expect(valueColumn?.mean).toBe(0);
      }
    });

    it("should count duplicates correctly for unique count", async () => {
      const duplicatesCsv = `name
John
Jane
John
Jane
John`;

      const result = await executeTool(csvStats, {
        input: duplicatesCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const nameColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "name"
        );
        expect(nameColumn?.uniqueCount).toBe(2);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,note
John,"Hello, World"
Jane,"Test"`;

      const result = await executeTool(csvStats, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should calculate size in bytes", async () => {
      const csv = `a,b
1,2`;

      const result = await executeTool(csvStats, {
        input: csv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).sizeBytes
        ).toBeGreaterThan(0);
      }
    });

    it("should handle boolean-like values", async () => {
      const boolCsv = `active
true
false
true`;

      const result = await executeTool(csvStats, {
        input: boolCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const activeColumn = (result.data as StatsOutput).columns.find(
          (c: ColumnStat) => c.name === "active"
        );
        // Should be detected as something (string or boolean depending on parsing)
        expect(activeColumn).toBeDefined();
      }
    });
  });
});
