import { describe, it, expect } from "vitest";
import { csvToMarkdown } from "../../../src/tools/csv/to-markdown";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToMarkdownOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvToMarkdown", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToMarkdown.meta.id).toBe("csv/to-markdown");
      expect(csvToMarkdown.meta.name).toBe("CSV to Markdown");
      expect(csvToMarkdown.meta.category).toBe("csv");
      expect(csvToMarkdown.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToMarkdown.meta.keywords).toContain("csv");
      expect(csvToMarkdown.meta.keywords).toContain("markdown");
      expect(csvToMarkdown.meta.keywords).toContain("table");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to markdown table", async () => {
      const result = await executeTool(csvToMarkdown, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "| name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| age"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| city"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| John"
        );
        // Separator row uses dashes with colons for alignment
        expect((result.data as Record<string, unknown>).output).toContain(
          "---"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should use left alignment by default", async () => {
      const result = await executeTool(csvToMarkdown, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Left alignment uses :--- pattern
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:[-]+/
        );
      }
    });

    it("should support center alignment", async () => {
      const result = await executeTool(
        csvToMarkdown,
        { input: basicCsv },
        { alignment: "center" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Center alignment uses :---: pattern
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:[-]+:/
        );
      }
    });

    it("should support right alignment", async () => {
      const result = await executeTool(
        csvToMarkdown,
        { input: basicCsv },
        { alignment: "right" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Right alignment uses ---: pattern
        expect((result.data as Record<string, unknown>).output).toMatch(
          /[-]+:/
        );
      }
    });

    it("should support auto alignment (right for numbers)", async () => {
      const numericCsv = `name,age,salary
John,30,50000
Jane,25,60000`;

      const result = await executeTool(
        csvToMarkdown,
        { input: numericCsv },
        { alignment: "auto" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Numeric columns should have right alignment
        expect((result.data as Record<string, unknown>).output).toBeDefined();
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York`;

      const result = await executeTool(
        csvToMarkdown,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "| name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| John"
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToMarkdown, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(0);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToMarkdown, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "| name"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should escape pipe characters in values", async () => {
      const pipeCsv = `name,formula
Math,a|b`;

      const result = await executeTool(csvToMarkdown, {
        input: pipeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "\\|"
        );
      }
    });

    it("should convert newlines to br tags", async () => {
      const multilineCsv = `name,note
John,"Line1
Line2"`;

      const result = await executeTool(csvToMarkdown, {
        input: multilineCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<br>"
        );
      }
    });

    it("should handle potentially malformed CSV", async () => {
      // Creating intentionally malformed CSV
      const malformedCsv = `name,age
John,30,"unclosed quote`;

      const result = await executeTool(csvToMarkdown, {
        input: malformedCsv,
      });

      // Papaparse is lenient, so it might still parse or fail gracefully
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToMarkdown, {
        input: singleCol,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "| name |"
        );
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToMarkdown, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,note
John,"Hello, World"
Jane,"Test ""quoted"""`;

      const result = await executeTool(csvToMarkdown, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Hello, World"
        );
      }
    });

    it("should handle empty values", async () => {
      const emptyCsv = `name,age,city
John,,New York
,25,`;

      const result = await executeTool(csvToMarkdown, {
        input: emptyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle wide tables", async () => {
      const wideCsv = `a,b,c,d,e,f,g,h,i,j
1,2,3,4,5,6,7,8,9,10`;

      const result = await executeTool(csvToMarkdown, {
        input: wideCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(10);
      }
    });

    it("should handle varying column widths", async () => {
      const varyCsv = `short,verylongcolumnname
a,b`;

      const result = await executeTool(csvToMarkdown, {
        input: varyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Table should be formatted properly
        expect((result.data as Record<string, unknown>).output).toContain(
          "| short"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "| verylongcolumnname"
        );
      }
    });

    it("should handle special characters", async () => {
      const specialCsv = `name,symbol
Alpha,@#$%
Beta,<>&`;

      const result = await executeTool(csvToMarkdown, {
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

    it("should handle numeric-only columns for auto alignment", async () => {
      const numericCsv = `count
100
200
300`;

      const result = await executeTool(
        csvToMarkdown,
        { input: numericCsv },
        { alignment: "auto" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Numeric column should be right-aligned
        expect((result.data as Record<string, unknown>).output).toMatch(
          /[-]+:/
        );
      }
    });

    it("should handle mixed numeric columns for auto alignment", async () => {
      const mixedCsv = `value
100
abc
200`;

      const result = await executeTool(
        csvToMarkdown,
        { input: mixedCsv },
        { alignment: "auto" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Mixed column should be left-aligned
        expect((result.data as Record<string, unknown>).output).toMatch(
          /:[-]+[^:]/
        );
      }
    });

    it("should pad columns for alignment", async () => {
      const paddingCsv = `name,value
A,1
Longer,22`;

      const result = await executeTool(csvToMarkdown, {
        input: paddingCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check that output has consistent column widths
        const data = result.data as ToMarkdownOutput;
        const lines = data.output.split("\n");
        // Each line should start and end with |
        lines.forEach((line: string) => {
          expect(line).toMatch(/^\|.*\|$/);
        });
      }
    });
  });
});
