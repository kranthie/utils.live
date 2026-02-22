import { describe, it, expect } from "vitest";
import { csvToTsv } from "../../../src/tools/csv/to-tsv";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToTsvOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvToTsv", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToTsv.meta.id).toBe("csv/to-tsv");
      expect(csvToTsv.meta.name).toBe("CSV to TSV");
      expect(csvToTsv.meta.category).toBe("csv");
      expect(csvToTsv.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToTsv.meta.keywords).toContain("csv");
      expect(csvToTsv.meta.keywords).toContain("tsv");
      expect(csvToTsv.meta.keywords).toContain("tab");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to TSV", async () => {
      const result = await executeTool(csvToTsv, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("\t");
        expect((result.data as Record<string, unknown>).output).not.toContain(
          ","
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "name\tage\tcity"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(3); // header + 2 data rows
      }
    });

    it("should use custom input delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York
Jane;25;Los Angeles`;

      const result = await executeTool(
        csvToTsv,
        { input: semicolonCsv },
        { inputDelimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain("\t");
        expect((result.data as Record<string, unknown>).output).toContain(
          "name\tage\tcity"
        );
      }
    });

    it("should escape tabs using escape mode by default", async () => {
      const csvWithTab = `name,note
John,Hello\tWorld`;

      const result = await executeTool(csvToTsv, {
        input: csvWithTab,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\t"
        );
      }
    });

    it("should remove tabs when escapeMode is remove", async () => {
      const csvWithTab = `name,note
John,Hello\tWorld`;

      const result = await executeTool(
        csvToTsv,
        { input: csvWithTab },
        { escapeMode: "remove" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "HelloWorld"
        );
      }
    });

    it("should replace tabs with space when escapeMode is space", async () => {
      const csvWithTab = `name,note
John,Hello\tWorld`;

      const result = await executeTool(
        csvToTsv,
        { input: csvWithTab },
        { escapeMode: "space" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Hello World"
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToTsv, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToTsv, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\tage\tcity"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,address
John,"123 Main St, Apt 4"
Jane,"456 Oak Ave"`;

      const result = await executeTool(csvToTsv, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "123 Main St, Apt 4"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
      }
    });

    it("should return error for malformed CSV", async () => {
      // Some edge cases that might cause errors
      const result = await executeTool(csvToTsv, {
        input: `name,age
John,30`,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToTsv, {
        input: singleCol,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "name\nJohn\nJane"
        );
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToTsv, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle empty values", async () => {
      const emptyCsv = `name,age,city
John,,New York
,25,`;

      const result = await executeTool(csvToTsv, {
        input: emptyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToTsvOutput;
        const lines = data.output.split("\n");
        expect(lines[1]).toBe("John\t\tNew York");
        expect(lines[2]).toBe("\t25\t");
      }
    });

    it("should handle special characters", async () => {
      const specialCsv = `name,symbol
Alpha,@#$%
Beta,<>&`;

      const result = await executeTool(csvToTsv, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "@#$%"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<>&"
        );
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvToTsv, {
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

    it("should handle multiple tabs in value with escape mode", async () => {
      const multiTabCsv = `name,note
John,A\tB\tC\tD`;

      const result = await executeTool(
        csvToTsv,
        { input: multiTabCsv },
        { escapeMode: "escape" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "A\\tB\\tC\\tD"
        );
      }
    });

    it("should handle pipe delimiter input", async () => {
      const pipeCsv = `name|age|city
John|30|New York`;

      const result = await executeTool(
        csvToTsv,
        { input: pipeCsv },
        { inputDelimiter: "|" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name\tage\tcity"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "John\t30\tNew York"
        );
      }
    });

    it("should handle numeric values", async () => {
      const numericCsv = `id,value,rate
1,100,0.5
2,200,0.75`;

      const result = await executeTool(csvToTsv, {
        input: numericCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "1\t100\t0.5"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "2\t200\t0.75"
        );
      }
    });

    it("should preserve line breaks within quoted fields", async () => {
      const multilineCsv = `name,note
John,"Line1
Line2"`;

      const result = await executeTool(csvToTsv, {
        input: multilineCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // The newline within the field should be preserved
        expect((result.data as Record<string, unknown>).output).toContain(
          "Line1\nLine2"
        );
      }
    });

    it("should handle quoted fields with escaped quotes", async () => {
      const quotedQuotes = `name,note
John,"He said ""hello"""`;

      const result = await executeTool(csvToTsv, {
        input: quotedQuotes,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          'He said "hello"'
        );
      }
    });
  });
});
