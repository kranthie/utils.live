import { describe, it, expect } from "vitest";
import { csvFilter } from "../../../src/tools/csv/filter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("csvFilter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvFilter.meta.id).toBe("csv/filter");
      expect(csvFilter.meta.name).toBe("CSV Filter");
      expect(csvFilter.meta.category).toBe("csv");
      expect(csvFilter.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvFilter.meta.keywords).toContain("csv");
      expect(csvFilter.meta.keywords).toContain("filter");
      expect(csvFilter.meta.keywords).toContain("query");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city,salary
John,30,New York,50000
Jane,25,Los Angeles,60000
Bob,35,Chicago,45000
Alice,28,Boston,70000`;

    it("should filter with equality operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: 'city == "New York"' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "Jane"
        );
      }
    });

    it("should filter with greater than operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age > 28" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bob"
        );
      }
    });

    it("should filter with less than operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age < 30" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alice"
        );
      }
    });

    it("should filter with greater than or equal operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age >= 30" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bob"
        );
      }
    });

    it("should filter with less than or equal operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age <= 28" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alice"
        );
      }
    });

    it("should filter with not equal operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: 'city != "New York"' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(3);
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "John"
        );
      }
    });

    it("should filter with contains operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "city contains Los" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
      }
    });

    it("should filter with startsWith operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "name startsWith J" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
      }
    });

    it("should filter with endsWith operator", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "city endsWith ton" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Alice"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Boston"
        );
      }
    });

    it("should handle case-insensitive string operations", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "city contains NEW" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age;city
John;30;New York
Jane;25;Los Angeles`;

      const result = await executeTool(
        csvFilter,
        { input: semicolonCsv },
        { filter: "age > 26", delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
      }
    });

    it("should include all rows with invalid filter", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "invalid filter syntax" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(
          (result.data as Record<string, unknown>).originalCount
        );
      }
    });

    it("should return empty result when no rows match", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age > 100" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(0);
      }
    });

    it("should report original and filtered counts", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age > 27" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).originalCount).toBe(4);
        expect((result.data as Record<string, unknown>).filteredCount).toBe(3);
      }
    });

    it("should handle numeric equality", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "age == 30" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
      }
    });

    it("should handle string equality without quotes", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "name == John" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
      }
    });

    it("should handle single-quoted strings", async () => {
      const result = await executeTool(
        csvFilter,
        { input: basicCsv },
        { filter: "city == 'Chicago'" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bob"
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty CSV", async () => {
      const result = await executeTool(
        csvFilter,
        { input: "name,age" },
        { filter: "age > 0" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).originalCount).toBe(0);
        expect((result.data as Record<string, unknown>).filteredCount).toBe(0);
      }
    });

    it("should handle quoted values in CSV", async () => {
      const quotedCsv = `name,address,age
"John, Jr.","123 Main St",30
Jane,"456 Oak Ave",25`;

      const result = await executeTool(
        csvFilter,
        { input: quotedCsv },
        { filter: "age > 26" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
      }
    });

    it("should handle column not found", async () => {
      const result = await executeTool(
        csvFilter,
        { input: `name,age\nJohn,30` },
        { filter: "nonexistent > 10" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Column not found, filter comparison fails, row not included
        expect((result.data as Record<string, unknown>).filteredCount).toBe(0);
      }
    });

    it("should handle NaN in numeric comparison", async () => {
      const csvWithText = `name,value
John,abc
Jane,30`;

      const result = await executeTool(
        csvFilter,
        { input: csvWithText },
        { filter: "value > 10" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(1);
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
      }
    });

    it("should handle header: false option", async () => {
      const noHeaderCsv = `John,30,New York
Jane,25,Los Angeles`;

      // When header is false, papaparse creates numeric column names
      const result = await executeTool(
        csvFilter,
        { input: noHeaderCsv },
        { filter: "1 > 26", header: false }
      );

      expect(result.success).toBe(true);
    });

    it("should handle empty values", async () => {
      const csvWithEmpty = `name,age
John,30
Jane,
Bob,25`;

      const result = await executeTool(
        csvFilter,
        { input: csvWithEmpty },
        { filter: "age > 0" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Empty value should not match numeric comparison
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
      }
    });

    it("should handle decimal numbers", async () => {
      const decimalCsv = `name,score
John,3.5
Jane,2.8
Bob,4.2`;

      const result = await executeTool(
        csvFilter,
        { input: decimalCsv },
        { filter: "score >= 3.0" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).filteredCount).toBe(2);
      }
    });
  });
});
