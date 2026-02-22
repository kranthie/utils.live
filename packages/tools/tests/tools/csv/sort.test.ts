import { describe, it, expect } from "vitest";
import { csvSort } from "../../../src/tools/csv/sort";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface SortOutput {
  output: string;
  rowCount: number;
}

describe("csvSort", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvSort.meta.id).toBe("csv/sort");
      expect(csvSort.meta.name).toBe("CSV Sort");
      expect(csvSort.meta.category).toBe("csv");
      expect(csvSort.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvSort.meta.keywords).toContain("csv");
      expect(csvSort.meta.keywords).toContain("sort");
      expect(csvSort.meta.keywords).toContain("order");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago
Alice,28,Boston`;

    it("should sort by string column ascending", async () => {
      const result = await executeTool(
        csvSort,
        { input: basicCsv },
        { column: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toContain("Alice");
        expect(lines[2]).toContain("Bob");
        expect(lines[3]).toContain("Jane");
        expect(lines[4]).toContain("John");
      }
    });

    it("should sort by string column descending", async () => {
      const result = await executeTool(
        csvSort,
        { input: basicCsv },
        { column: "name", order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toContain("John");
        expect(lines[2]).toContain("Jane");
        expect(lines[3]).toContain("Bob");
        expect(lines[4]).toContain("Alice");
      }
    });

    it("should sort by numeric column ascending", async () => {
      const result = await executeTool(
        csvSort,
        { input: basicCsv },
        { column: "age", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toContain("25"); // Jane
        expect(lines[2]).toContain("28"); // Alice
        expect(lines[3]).toContain("30"); // John
        expect(lines[4]).toContain("35"); // Bob
      }
    });

    it("should sort by numeric column descending", async () => {
      const result = await executeTool(
        csvSort,
        { input: basicCsv },
        { column: "age", numeric: true, order: "desc" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toContain("35"); // Bob
        expect(lines[2]).toContain("30"); // John
        expect(lines[3]).toContain("28"); // Alice
        expect(lines[4]).toContain("25"); // Jane
      }
    });

    it("should sort case-insensitively when caseInsensitive is true", async () => {
      const mixedCaseCsv = `name,value
alice,1
Bob,2
ALICE,3
bob,4`;

      const result = await executeTool(
        csvSort,
        { input: mixedCaseCsv },
        { column: "name", caseInsensitive: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as SortOutput;
        const lines = data.output.split("\n");
        // All alice/ALICE should come before bob/Bob
        const aliceLines = lines.filter((l: string) =>
          l.toLowerCase().includes("alice")
        );
        const bobLines = lines.filter((l: string) =>
          l.toLowerCase().includes("bob")
        );
        expect(aliceLines.length).toBe(2);
        expect(bobLines.length).toBe(2);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30
Jane;25
Bob;35`;

      const result = await executeTool(
        csvSort,
        { input: semicolonCsv },
        { column: "age", numeric: true, delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).output).toContain(";");
      }
    });

    it("should use default column when not provided", async () => {
      const result = await executeTool(csvSort, { input: basicCsv }, {});

      expect(result.success).toBe(true);
      if (result.success) {
        // Default column is "name", so sorted alphabetically by name
        expect((result.data as SortOutput).rowCount).toBe(4);
      }
    });

    it("should handle missing column in rows", async () => {
      const incompleteCsv = `name,age
John,30
Jane`;

      const result = await executeTool(
        csvSort,
        { input: incompleteCsv },
        { column: "age", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(2);
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(
        csvSort,
        { input: "name,age" },
        { column: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(0);
      }
    });

    it("should handle null/undefined values in sort column", async () => {
      const csvWithEmpty = `name,age
John,30
Jane,
Bob,25`;

      const result = await executeTool(
        csvSort,
        { input: csvWithEmpty },
        { column: "age", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(3);
      }
    });

    it("should sort text values when numeric is false but column has numbers", async () => {
      const csvWithNumbers = `id,value
10,a
2,b
1,c`;

      const result = await executeTool(
        csvSort,
        { input: csvWithNumbers },
        { column: "id", numeric: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (result.data as SortOutput).output.split("\n");
        // String sort: "1" < "10" < "2"
        expect(lines[1]).toContain("1,c");
        expect(lines[2]).toContain("10,a");
        expect(lines[3]).toContain("2,b");
      }
    });

    it("should sort numerically when numeric is true", async () => {
      const csvWithNumbers = `id,value
10,a
2,b
1,c`;

      const result = await executeTool(
        csvSort,
        { input: csvWithNumbers },
        { column: "id", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (result.data as SortOutput).output.split("\n");
        // Numeric sort: 1 < 2 < 10
        expect(lines[1]).toContain("1,c");
        expect(lines[2]).toContain("2,b");
        expect(lines[3]).toContain("10,a");
      }
    });

    it("should report correct row count", async () => {
      const result = await executeTool(
        csvSort,
        { input: basicCsv },
        { column: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(4);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(
        csvSort,
        { input: singleRow },
        { column: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(1);
      }
    });

    it("should handle special characters in values", async () => {
      const specialCsv = `name,symbol
Alpha,@
Beta,$
Gamma,#`;

      const result = await executeTool(
        csvSort,
        { input: specialCsv },
        { column: "symbol" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(3);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,city
"John, Jr.","New York"
Alice,Boston`;

      const result = await executeTool(
        csvSort,
        { input: quotedCsv },
        { column: "name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (result.data as SortOutput).output.split("\n");
        expect(lines[1]).toContain("Alice");
      }
    });

    it("should handle decimal numbers", async () => {
      const decimalCsv = `name,score
John,3.5
Jane,2.8
Bob,4.2`;

      const result = await executeTool(
        csvSort,
        { input: decimalCsv },
        { column: "score", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (result.data as SortOutput).output.split("\n");
        expect(lines[1]).toContain("2.8");
        expect(lines[2]).toContain("3.5");
        expect(lines[3]).toContain("4.2");
      }
    });

    it("should handle negative numbers", async () => {
      const negativeCsv = `name,value
A,-10
B,5
C,-5`;

      const result = await executeTool(
        csvSort,
        { input: negativeCsv },
        { column: "value", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const lines = (result.data as SortOutput).output.split("\n");
        expect(lines[1]).toContain("-10");
        expect(lines[2]).toContain("-5");
        expect(lines[3]).toContain("5");
      }
    });

    it("should handle NaN values in numeric sort", async () => {
      const mixedCsv = `name,value
A,10
B,abc
C,5`;

      const result = await executeTool(
        csvSort,
        { input: mixedCsv },
        { column: "value", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // NaN values should be sorted to the end
        const lines = (result.data as SortOutput).output.split("\n");
        expect(lines[1]).toContain("5");
        expect(lines[2]).toContain("10");
        expect(lines[3]).toContain("abc");
      }
    });

    it("should handle all NaN values in numeric sort", async () => {
      const allTextCsv = `name,value
A,abc
B,def
C,ghi`;

      const result = await executeTool(
        csvSort,
        { input: allTextCsv },
        { column: "value", numeric: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as SortOutput).rowCount).toBe(3);
      }
    });
  });
});
