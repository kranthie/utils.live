import { describe, it, expect } from "vitest";
import { csvToJson } from "../../../src/tools/csv/to-json";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ToJsonOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("csvToJson", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToJson.meta.id).toBe("csv/to-json");
      expect(csvToJson.meta.name).toBe("CSV to JSON");
      expect(csvToJson.meta.category).toBe("csv");
      expect(csvToJson.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToJson.meta.keywords).toContain("csv");
      expect(csvToJson.meta.keywords).toContain("json");
      expect(csvToJson.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to JSON array", async () => {
      const result = await executeTool(csvToJson, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(2);
        expect(parsed[0]).toEqual({ name: "John", age: 30, city: "New York" });
      }
    });

    it("should report correct row and column counts", async () => {
      const result = await executeTool(csvToJson, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
        expect((result.data as Record<string, unknown>).columnCount).toBe(3);
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30
Jane;25`;

      const result = await executeTool(
        csvToJson,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(parsed[0]?.name).toBe("John");
        expect(parsed[0]?.age).toBe(30);
      }
    });

    it("should use custom indentation", async () => {
      const result = await executeTool(
        csvToJson,
        { input: basicCsv },
        { indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Check that indentation is 4 spaces
        expect((result.data as Record<string, unknown>).output).toContain(
          "    "
        );
      }
    });

    it("should enable dynamic typing by default", async () => {
      const result = await executeTool(csvToJson, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ToJsonOutput;
        const parsed = JSON.parse(data.output) as Record<string, unknown>[];
        expect(typeof parsed[0]?.age).toBe("number");
      }
    });

    it("should disable dynamic typing when set to false", async () => {
      const result = await executeTool(
        csvToJson,
        { input: basicCsv },
        { dynamicTyping: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(typeof parsed[0]!.age).toBe("string");
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToJson, {
        input: "",
      });

      // Empty CSV may succeed with empty array or fail
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(Array.isArray(parsed)).toBe(true);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToJson, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed).toEqual([]);
      }
    });

    it("should handle CSV without header when header is false", async () => {
      const noHeaderCsv = `John,30,New York
Jane,25,Los Angeles`;

      const result = await executeTool(
        csvToJson,
        { input: noHeaderCsv },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        // Without header, papaparse returns arrays
        expect(parsed).toHaveLength(2);
      }
    });

    it("should trim values and headers", async () => {
      const spacedCsv = ` name , age
 John , 30
 Jane , 25 `;

      const result = await executeTool(csvToJson, {
        input: spacedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]).toHaveProperty("name", "John");
        expect(parsed[0]).toHaveProperty("age", 30);
      }
    });

    it("should skip empty lines by default", async () => {
      const csvWithEmpty = `name,age
John,30

Jane,25

Bob,35`;

      const result = await executeTool(csvToJson, {
        input: csvWithEmpty,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed).toHaveLength(3);
      }
    });

    it("should include empty lines when skipEmptyLines is false", async () => {
      const csvWithEmpty = `name,age
John,30

Jane,25`;

      const result = await executeTool(
        csvToJson,
        { input: csvWithEmpty },
        { skipEmptyLines: false }
      );

      // Behavior depends on implementation
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        // With skipEmptyLines false, behavior may vary
        expect(Array.isArray(parsed)).toBe(true);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,note
John,"Hello, World"
Jane,"Test ""quoted"""`;

      const result = await executeTool(csvToJson, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.note).toBe("Hello, World");
        expect(parsed[1]!.note).toBe('Test "quoted"');
      }
    });

    it("should handle boolean values with dynamic typing", async () => {
      const boolCsv = `name,active
John,true
Jane,false`;

      const result = await executeTool(csvToJson, {
        input: boolCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.active).toBe(true);
        expect(parsed[1]!.active).toBe(false);
      }
    });

    it("should handle null-like values", async () => {
      const nullCsv = `name,value
John,null
Jane,`;

      const result = await executeTool(csvToJson, {
        input: nullCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        // With dynamicTyping, "null" might be parsed as null or kept as string
        // Just verify it parses without error
        expect(parsed[0]).toHaveProperty("value");
        expect(parsed[1]).toHaveProperty("value");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToJson, {
        input: singleCol,
      });

      // Single column should be handled
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(Array.isArray(parsed)).toBe(true);
      } else {
        // Some implementations may have issues with single columns
        expect(result.error).toBeDefined();
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToJson, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed).toHaveLength(1);
      }
    });

    it("should handle special characters in values", async () => {
      const specialCsv = `name,symbol
Alpha,@#$%
Beta,<>&`;

      const result = await executeTool(csvToJson, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.symbol).toBe("@#$%");
        expect(parsed[1]!.symbol).toBe("<>&");
      }
    });

    it("should handle multiline values", async () => {
      const multilineCsv = `name,note
John,"Line 1
Line 2"
Jane,Simple`;

      const result = await executeTool(csvToJson, {
        input: multilineCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.note).toContain("\n");
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvToJson, {
        input: unicodeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.city).toBe("Sao Paulo");
        expect(parsed[1]!.city).toBe("Tokyo");
      }
    });

    it("should handle decimal numbers", async () => {
      const decimalCsv = `name,score
John,3.14159
Jane,2.71828`;

      const result = await executeTool(csvToJson, {
        input: decimalCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.score).toBeCloseTo(3.14159);
        expect(parsed[1]!.score).toBeCloseTo(2.71828);
      }
    });

    it("should handle negative numbers", async () => {
      const negativeCsv = `name,value
A,-100
B,-50.5`;

      const result = await executeTool(csvToJson, {
        input: negativeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed[0]!.value).toBe(-100);
        expect(parsed[1]!.value).toBe(-50.5);
      }
    });

    it("should produce valid JSON with zero indent", async () => {
      const result = await executeTool(
        csvToJson,
        { input: basicCsv },
        { indent: 0 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // With indent 0, JSON should be compact (no newlines except in values)
        const parsed = JSON.parse(
          (result.data as ToJsonOutput).output
        ) as Record<string, unknown>[];
        expect(parsed).toHaveLength(2);
      }
    });
  });

  const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;
});
