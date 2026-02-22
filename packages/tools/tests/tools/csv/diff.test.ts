import { describe, it, expect } from "vitest";
import { csvDiff } from "../../../src/tools/csv/diff";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface DiffOutput {
  identical: boolean;
  headerDiff: {
    added: string[];
    removed: string[];
    common: string[];
  };
  rowDiff: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
  details: Array<{
    row: number;
    type: "added" | "removed" | "modified";
    data: Record<string, unknown>;
    changes?: string[];
  }>;
}

describe("csvDiff", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvDiff.meta.id).toBe("csv/diff");
      expect(csvDiff.meta.name).toBe("CSV Diff");
      expect(csvDiff.meta.category).toBe("csv");
      expect(csvDiff.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvDiff.meta.keywords).toContain("csv");
      expect(csvDiff.meta.keywords).toContain("diff");
      expect(csvDiff.meta.keywords).toContain("compare");
    });
  });

  describe("execute", () => {
    const csv1 = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

    const csv2 = `name,age,city
John,30,New York
Jane,26,Los Angeles
Alice,28,Boston`;

    it("should detect identical CSVs", async () => {
      const result = await executeTool(csvDiff, {
        input1: csv1,
        input2: csv1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
        expect(data.rowDiff.added).toBe(0);
        expect(data.rowDiff.removed).toBe(0);
        expect(data.rowDiff.modified).toBe(0);
        expect(data.rowDiff.unchanged).toBe(3);
      }
    });

    it("should detect modified rows by position", async () => {
      const result = await executeTool(csvDiff, {
        input1: csv1,
        input2: csv2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.rowDiff.modified).toBeGreaterThan(0);
      }
    });

    it("should detect added headers", async () => {
      const csv2WithExtra = `name,age,city,country
John,30,New York,USA`;

      const result = await executeTool(csvDiff, {
        input1: `name,age,city\nJohn,30,New York`,
        input2: csv2WithExtra,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.headerDiff.added).toContain("country");
        expect(data.headerDiff.removed).toHaveLength(0);
      }
    });

    it("should detect removed headers", async () => {
      const csv1Full = `name,age,city,country
John,30,New York,USA`;

      const csv2Less = `name,age,city
John,30,New York`;

      const result = await executeTool(csvDiff, {
        input1: csv1Full,
        input2: csv2Less,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.headerDiff.removed).toContain("country");
        expect(data.headerDiff.added).toHaveLength(0);
      }
    });

    it("should identify common headers", async () => {
      const result = await executeTool(csvDiff, {
        input1: csv1,
        input2: csv2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.headerDiff.common).toEqual(["name", "age", "city"]);
      }
    });

    it("should use key column for comparison", async () => {
      const csvA = `id,name,value
1,John,100
2,Jane,200
3,Bob,300`;

      const csvB = `id,name,value
1,John,150
2,Jane,200
4,Alice,400`;

      const result = await executeTool(
        csvDiff,
        { input1: csvA, input2: csvB },
        { keyColumn: "id" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.rowDiff.modified).toBe(1); // id=1 changed
        expect(data.rowDiff.removed).toBe(1); // id=3 removed
        expect(data.rowDiff.added).toBe(1); // id=4 added
        expect(data.rowDiff.unchanged).toBe(1); // id=2 unchanged
      }
    });

    it("should respect maxDetails limit", async () => {
      const manyRowsCsv1 = `id,value\n${Array.from({ length: 50 }, (_, i) => `${i},a`).join("\n")}`;
      const manyRowsCsv2 = `id,value\n${Array.from({ length: 50 }, (_, i) => `${i},b`).join("\n")}`;

      const result = await executeTool(
        csvDiff,
        { input1: manyRowsCsv1, input2: manyRowsCsv2 },
        { maxDetails: 10 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.details.length).toBeLessThanOrEqual(10);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv1 = `name;age
John;30`;
      const semicolonCsv2 = `name;age
John;31`;

      const result = await executeTool(
        csvDiff,
        { input1: semicolonCsv1, input2: semicolonCsv2 },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.rowDiff.modified).toBe(1);
      }
    });

    it("should handle empty CSVs", async () => {
      const result = await executeTool(csvDiff, {
        input1: "",
        input2: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });

    it("should handle one empty CSV", async () => {
      const result = await executeTool(csvDiff, {
        input1: csv1,
        input2: `name,age,city`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.rowDiff.removed).toBe(3);
      }
    });

    it("should detect rows added in second CSV", async () => {
      const csvShort = `name,age
John,30`;

      const csvLong = `name,age
John,30
Jane,25`;

      const result = await executeTool(csvDiff, {
        input1: csvShort,
        input2: csvLong,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.rowDiff.added).toBe(1);
      }
    });

    it("should provide change details for modified rows", async () => {
      const csvA = `name,age,city
John,30,New York`;

      const csvB = `name,age,city
John,31,Boston`;

      const result = await executeTool(csvDiff, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        const modifiedDetail = data.details.find((d) => d.type === "modified");
        expect(modifiedDetail).toBeDefined();
        expect(modifiedDetail?.changes).toContain("age");
        expect(modifiedDetail?.changes).toContain("city");
      }
    });

    it("should handle header: false option", async () => {
      const dataOnly1 = `John,30,New York
Jane,25,Los Angeles`;

      const dataOnly2 = `John,30,New York
Jane,26,Los Angeles`;

      const result = await executeTool(
        csvDiff,
        { input1: dataOnly1, input2: dataOnly2 },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.rowDiff.modified).toBe(1);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle completely different CSVs", async () => {
      const csvA = `a,b
1,2`;

      const csvB = `x,y
3,4`;

      const result = await executeTool(csvDiff, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(false);
        expect(data.headerDiff.added).toEqual(["x", "y"]);
        expect(data.headerDiff.removed).toEqual(["a", "b"]);
      }
    });

    it("should handle quoted fields", async () => {
      const csvA = `name,note
John,"Hello, World"`;

      const csvB = `name,note
John,"Hello, World"`;

      const result = await executeTool(csvDiff, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.identical).toBe(true);
      }
    });

    it("should handle numeric type changes", async () => {
      const csvA = `id,value
1,100`;

      const csvB = `id,value
1,100.0`;

      const result = await executeTool(csvDiff, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // 100 vs 100.0 may or may not be considered identical depending on parsing
        // Just verify the diff operation completes successfully
        const data = result.data as DiffOutput;
        expect(data.rowDiff).toBeDefined();
      }
    });

    it("should handle row detail type field", async () => {
      const csvA = `name,age
John,30`;

      const csvB = `name,age
Jane,25`;

      const result = await executeTool(csvDiff, {
        input1: csvA,
        input2: csvB,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as DiffOutput;
        expect(data.details.length).toBeGreaterThan(0);
        data.details.forEach((detail) => {
          expect(["added", "removed", "modified"]).toContain(detail.type);
        });
      }
    });
  });
});
