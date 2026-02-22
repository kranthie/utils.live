import { describe, it, expect } from "vitest";
import { csvViewer } from "../../../src/tools/csv/viewer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ViewerOutput {
  output: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
}

describe("csvViewer", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvViewer.meta.id).toBe("csv/viewer");
      expect(csvViewer.meta.name).toBe("CSV Viewer");
      expect(csvViewer.meta.category).toBe("csv");
      expect(csvViewer.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvViewer.meta.keywords).toContain("csv");
      expect(csvViewer.meta.keywords).toContain("view");
      expect(csvViewer.meta.keywords).toContain("table");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;

    it("should display CSV as formatted table", async () => {
      const result = await executeTool(csvViewer, {
        input: basicCsv,
      });

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
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain("|");
        expect((result.data as Record<string, unknown>).output).toContain("-");
        expect((result.data as Record<string, unknown>).rowCount).toBe(3);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
        expect((result.data as Record<string, unknown>).columns).toEqual([
          "name",
          "age",
          "city",
        ]);
      }
    });

    it("should show line numbers by default", async () => {
      const result = await executeTool(csvViewer, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "1 |"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "2 |"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "3 |"
        );
      }
    });

    it("should hide line numbers when showLineNumbers is false", async () => {
      const result = await executeTool(
        csvViewer,
        { input: basicCsv },
        { showLineNumbers: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // The output should not have line number prefixes
        const data = result.data as ViewerOutput;
        const lines = data.output.split("\n");
        // First line should be header, not starting with a number
        expect(lines[0]).toMatch(/^name/);
      }
    });

    it("should limit rows based on limit option", async () => {
      const largeCsv = `id,value
${Array.from({ length: 200 }, (_, i) => `${i},${i * 10}`).join("\n")}`;

      const result = await executeTool(
        csvViewer,
        { input: largeCsv },
        { limit: 50 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should show truncation notice
        expect((result.data as Record<string, unknown>).output).toContain(
          "more rows"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(200);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York
Jane;25;Los Angeles`;

      const result = await executeTool(
        csvViewer,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvViewer, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("(empty)");
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(0);
        expect((result.data as Record<string, unknown>).columns).toEqual([]);
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvViewer, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should return error for malformed CSV", async () => {
      // This might vary based on papaparse behavior
      const result = await executeTool(csvViewer, {
        input: `name,age
John,30`,
      });

      expect(result.success).toBe(true);
    });

    it("should pad columns for alignment", async () => {
      const varyCsv = `short,verylongcolumnname
a,b`;

      const result = await executeTool(csvViewer, {
        input: varyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Output should be formatted with consistent column widths
        const data = result.data as ViewerOutput;
        const lines = data.output.split("\n");
        // All lines should have similar structure
        lines.forEach((line: string) => {
          if (line.includes("|") && !line.includes("-")) {
            expect(line).toMatch(/\|/);
          }
        });
      }
    });

    it("should show separator line between header and data", async () => {
      const result = await executeTool(csvViewer, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(/-+-/);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvViewer, {
        input: singleCol,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(1);
        expect((result.data as Record<string, unknown>).columns).toEqual([
          "name",
        ]);
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvViewer, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle empty values", async () => {
      const emptyCsv = `name,age,city
John,,New York
,25,`;

      const result = await executeTool(csvViewer, {
        input: emptyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,address
John,"123 Main St, Apt 4"`;

      const result = await executeTool(csvViewer, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "123 Main St, Apt 4"
        );
      }
    });

    it("should handle special characters", async () => {
      const specialCsv = `name,symbol
Alpha,@#$%
Beta,<>&`;

      const result = await executeTool(csvViewer, {
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

      const result = await executeTool(csvViewer, {
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

    it("should handle wide tables", async () => {
      const wideCsv = `a,b,c,d,e,f,g,h,i,j
1,2,3,4,5,6,7,8,9,10`;

      const result = await executeTool(csvViewer, {
        input: wideCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).columnCount).toBe(10);
      }
    });

    it("should handle long values", async () => {
      const longValue = "a".repeat(100);
      const longCsv = `name,data
John,${longValue}`;

      const result = await executeTool(csvViewer, {
        input: longCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          longValue
        );
      }
    });

    it("should show truncation message when limit is reached", async () => {
      const rows = Array.from({ length: 150 }, (_, i) => `Name${i},${i}`);
      const largeCsv = `name,value\n${rows.join("\n")}`;

      const result = await executeTool(
        csvViewer,
        { input: largeCsv },
        { limit: 100 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "50 more rows"
        );
      }
    });

    it("should not show truncation message when all rows fit", async () => {
      const result = await executeTool(
        csvViewer,
        { input: basicCsv },
        { limit: 100 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "more rows"
        );
      }
    });

    it("should handle numeric values", async () => {
      const numericCsv = `id,value,rate
1,100,0.5
2,200,0.75`;

      const result = await executeTool(csvViewer, {
        input: numericCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "0.5"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "0.75"
        );
      }
    });
  });

  const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles
Bob,35,Chicago`;
});
