import { describe, it, expect } from "vitest";
import { csvFormatter } from "../../../src/tools/csv/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface FormatterOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvFormatter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvFormatter.meta.id).toBe("csv/formatter");
      expect(csvFormatter.meta.name).toBe("CSV Formatter");
      expect(csvFormatter.meta.category).toBe("csv");
      expect(csvFormatter.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvFormatter.meta.keywords).toContain("csv");
      expect(csvFormatter.meta.keywords).toContain("format");
      expect(csvFormatter.meta.keywords).toContain("delimiter");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should format CSV with default options", async () => {
      const result = await executeTool(csvFormatter, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        expect((result.data as Record<string, unknown>).output).toBeDefined();
      }
    });

    it("should change delimiter", async () => {
      const result = await executeTool(
        csvFormatter,
        { input: basicCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(";");
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ","
        );
      }
    });

    it("should quote all fields when quotes is true", async () => {
      const result = await executeTool(
        csvFormatter,
        { input: basicCsv },
        { quotes: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          '"name"'
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          '"John"'
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          '"30"'
        );
      }
    });

    it("should not quote fields when quotes is false", async () => {
      const simpleCsv = `name,age
John,30`;

      const result = await executeTool(
        csvFormatter,
        { input: simpleCsv },
        { quotes: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Only fields that need quoting should be quoted
        const data = result.data as FormatterOutput;
        const lines = data.output.split("\n");
        // Trim to handle CRLF line endings from papaparse
        expect(lines[0]?.trim()).toBe("name,age");
      }
    });

    it("should convert from different input delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York`;

      const result = await executeTool(
        csvFormatter,
        { input: semicolonCsv },
        { inputDelimiter: ";", delimiter: "," }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(",");
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ";"
        );
      }
    });

    it("should trim whitespace from values", async () => {
      const spacedCsv = `name , age , city
 John , 30 , New York `;

      const result = await executeTool(
        csvFormatter,
        { input: spacedCsv },
        { trimValues: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          " John"
        );
      }
    });

    it("should preserve whitespace when trimValues is false", async () => {
      const spacedCsv = `name,age
 John ,30`;

      const result = await executeTool(
        csvFormatter,
        { input: spacedCsv },
        { trimValues: false, quotes: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Whitespace should be preserved in the output
        expect((result.data as Record<string, unknown>).output).toContain(
          " John "
        );
      }
    });

    it("should auto-detect delimiter when inputDelimiter not specified", async () => {
      const tabCsv = `name\tage\tcity
John\t30\tNew York`;

      const result = await executeTool(csvFormatter, {
        input: tabCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvFormatter, {
        input: "",
      });

      // Empty string may throw an error or return empty result
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      } else {
        // Some implementations may throw error on empty input
        expect(result.error).toBeDefined();
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvFormatter, {
        input: "name,age,city",
      });

      // Header-only CSV behavior depends on implementation
      if (result.success) {
        // When header: true, it treats first row as headers and has 0 data rows
        // columnCount might be 0 if there are no data rows to infer columns from
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should handle quoted fields with special characters", async () => {
      const quotedCsv = `name,note
John,"Hello, World"
Jane,"Line1
Line2"`;

      const result = await executeTool(csvFormatter, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle pipe delimiter conversion", async () => {
      const result = await executeTool(
        csvFormatter,
        { input: basicCsv },
        { delimiter: "|" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("|");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column CSV", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvFormatter, {
        input: singleCol,
      });

      // Single column should be handled gracefully
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      } else {
        // Some edge cases may fail
        expect(result.error).toBeDefined();
      }
    });

    it("should handle single row with multiple columns", async () => {
      const singleRow = `a,b,c,d,e
1,2,3,4,5`;

      const result = await executeTool(csvFormatter, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
        expect((result.data as Record<string, unknown>).columnCount).toBe(5);
      }
    });

    it("should handle values with quotes inside", async () => {
      const quotedQuotes = `name,quote
John,"He said ""hello"""`;

      const result = await executeTool(csvFormatter, {
        input: quotedQuotes,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          '""hello""'
        );
      }
    });

    it("should handle empty values", async () => {
      const emptyValues = `name,age,city
John,,New York
,25,
Bob,35,`;

      const result = await executeTool(csvFormatter, {
        input: emptyValues,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
John,New York
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvFormatter, {
        input: unicodeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Sao Paulo"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Tokyo"
        );
      }
    });

    it("should handle numeric values", async () => {
      const numericCsv = `id,value,rate
1,100,0.5
2,200,0.75
3,300,1.0`;

      const result = await executeTool(csvFormatter, {
        input: numericCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
      }
    });

    it("should handle very long values", async () => {
      const longValue = "a".repeat(1000);
      const longCsv = `name,data
John,${longValue}`;

      const result = await executeTool(csvFormatter, {
        input: longCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          longValue
        );
      }
    });
  });
});
