import { describe, it, expect } from "vitest";
import { csvMerge } from "../../../src/tools/csv/merge";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface MergeOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvMerge", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvMerge.meta.id).toBe("csv/merge");
      expect(csvMerge.meta.name).toBe("CSV Merge");
      expect(csvMerge.meta.category).toBe("csv");
      expect(csvMerge.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvMerge.meta.keywords).toContain("csv");
      expect(csvMerge.meta.keywords).toContain("merge");
      expect(csvMerge.meta.keywords).toContain("join");
    });
  });

  describe("execute", () => {
    const csv1 = `name,age
John,30
Jane,25`;

    const csv2 = `name,age
Bob,35
Alice,28`;

    it("should append CSVs by default", async () => {
      const result = await executeTool(csvMerge, {
        input1: csv1,
        input2: csv2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(4);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bob"
        );
      }
    });

    it("should merge with append strategy explicitly", async () => {
      const result = await executeTool(
        csvMerge,
        { input1: csv1, input2: csv2 },
        { strategy: "append" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(4);
      }
    });

    it("should merge with union strategy for different columns", async () => {
      const csvA = `name,age
John,30`;

      const csvB = `name,city
Jane,NYC`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "union" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "age"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "city"
        );
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should merge with join strategy", async () => {
      const csvA = `id,name
1,John
2,Jane`;

      const csvB = `id,salary
1,50000
2,60000`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "join", joinColumn: "id" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "salary"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "50000"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should return error for join without joinColumn", async () => {
      const result = await executeTool(
        csvMerge,
        { input1: csv1, input2: csv2 },
        { strategy: "join" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("CSV_PARSE_ERROR");
        expect(result.error.message).toContain("joinColumn");
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv1 = `name;age
John;30`;
      const semicolonCsv2 = `name;age
Jane;25`;

      const result = await executeTool(
        csvMerge,
        { input1: semicolonCsv1, input2: semicolonCsv2 },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(";");
      }
    });

    it("should deduplicate rows when deduplicateRows is true", async () => {
      const csvWithDupes = `name,age
John,30`;

      const result = await executeTool(
        csvMerge,
        { input1: csvWithDupes, input2: csvWithDupes },
        { deduplicateRows: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should keep duplicates when deduplicateRows is false", async () => {
      const csvWithDupes = `name,age
John,30`;

      const result = await executeTool(
        csvMerge,
        { input1: csvWithDupes, input2: csvWithDupes },
        { deduplicateRows: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle empty first CSV", async () => {
      const result = await executeTool(csvMerge, {
        input1: "name,age",
        input2: csv2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle empty second CSV", async () => {
      const result = await executeTool(csvMerge, {
        input1: csv1,
        input2: "name,age",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle both CSVs empty", async () => {
      const result = await executeTool(csvMerge, {
        input1: "",
        input2: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should add missing keys from second CSV in join", async () => {
      const csvA = `id,name
1,John
2,Jane`;

      const csvB = `id,salary
1,50000
3,70000`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "join", joinColumn: "id" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should include id=3 from csvB
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
        expect((result.data as Record<string, unknown>).output).toContain(
          "70000"
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle union with completely different columns", async () => {
      const csvA = `a,b
1,2`;

      const csvB = `c,d
3,4`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "union" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(4);
      }
    });

    it("should handle quoted fields", async () => {
      const csvA = `name,note
"John, Jr.","Hello"`;

      const csvB = `name,note
Jane,"World"`;

      const result = await executeTool(csvMerge, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should preserve order in append strategy", async () => {
      const csvA = `id
1
2`;
      const csvB = `id
3
4`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "append" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as MergeOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toContain("1");
        expect(lines[2]).toContain("2");
        expect(lines[3]).toContain("3");
        expect(lines[4]).toContain("4");
      }
    });

    it("should handle join with no matching keys", async () => {
      const csvA = `id,name
1,John`;

      const csvB = `id,salary
2,50000`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "join", joinColumn: "id" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Both rows should be present
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should fill empty values in union strategy", async () => {
      const csvA = `name,age
John,30`;

      const csvB = `name,city
Jane,LA`;

      const result = await executeTool(
        csvMerge,
        { input1: csvA, input2: csvB },
        { strategy: "union" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // John should have empty city, Jane should have empty age
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
      }
    });

    it("should handle header: false option", async () => {
      const noHeader1 = `John,30`;
      const noHeader2 = `Jane,25`;

      const result = await executeTool(
        csvMerge,
        { input1: noHeader1, input2: noHeader2 },
        { header: false }
      );

      expect(result.success).toBe(true);
    });

    it("should handle many rows efficiently", async () => {
      const generateCsv = (start: number, count: number): string => {
        const header = "id,value";
        const rows = Array.from(
          { length: count },
          (_, i) => `${start + i},${(start + i) * 10}`
        );
        return [header, ...rows].join("\n");
      };

      const result = await executeTool(csvMerge, {
        input1: generateCsv(1, 100),
        input2: generateCsv(101, 100),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(200);
      }
    });
  });
});
