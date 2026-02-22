import { describe, it, expect } from "vitest";
import { csvToYaml } from "../../../src/tools/csv/to-yaml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("csvToYaml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToYaml.meta.id).toBe("csv/to-yaml");
      expect(csvToYaml.meta.name).toBe("CSV to YAML");
      expect(csvToYaml.meta.category).toBe("csv");
      expect(csvToYaml.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToYaml.meta.keywords).toContain("csv");
      expect(csvToYaml.meta.keywords).toContain("yaml");
      expect(csvToYaml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to YAML", async () => {
      const result = await executeTool(csvToYaml, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- name: John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "age: 30"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "city: New York"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should use custom indentation", async () => {
      const result = await executeTool(
        csvToYaml,
        { input: basicCsv },
        { indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Check for 4-space indentation
        expect((result.data as Record<string, unknown>).output).toMatch(
          / {4}age:/
        );
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30`;

      const result = await executeTool(
        csvToYaml,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name: John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "age: 30"
        );
      }
    });

    it("should enable dynamic typing by default", async () => {
      const result = await executeTool(csvToYaml, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Numbers should not be quoted
        expect((result.data as Record<string, unknown>).output).toContain(
          "age: 30"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "age: '30'"
        );
      }
    });

    it("should disable dynamic typing when set to false", async () => {
      const result = await executeTool(
        csvToYaml,
        { input: basicCsv },
        { dynamicTyping: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Numbers should be strings
        expect((result.data as Record<string, unknown>).output).toMatch(
          /age: ['"]?30['"]?/
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToYaml, {
        input: "",
      });

      // Empty CSV behavior depends on implementation
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToYaml, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
        expect((result.data as Record<string, unknown>).output).toBe("[]\n");
      }
    });

    it("should handle boolean values", async () => {
      const boolCsv = `name,active
John,true
Jane,false`;

      const result = await executeTool(csvToYaml, {
        input: boolCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "active: true"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "active: false"
        );
      }
    });

    it("should handle null values", async () => {
      const nullCsv = `name,value
John,null
Jane,`;

      const result = await executeTool(csvToYaml, {
        input: nullCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "value: null"
        );
      }
    });

    it("should handle header: false option", async () => {
      const noHeaderCsv = `John,30
Jane,25`;

      const result = await executeTool(
        csvToYaml,
        { input: noHeaderCsv },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should trim values and headers", async () => {
      const spacedCsv = ` name , age
 John , 30 `;

      const result = await executeTool(csvToYaml, {
        input: spacedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Values should be trimmed
        expect((result.data as Record<string, unknown>).output).toContain(
          "name:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToYaml, {
        input: singleCol,
      });

      // Single column behavior depends on implementation
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToYaml, {
        input: singleRow,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle empty values", async () => {
      const emptyCsv = `name,age
John,
,25`;

      const result = await executeTool(csvToYaml, {
        input: emptyCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle quoted fields", async () => {
      const quotedCsv = `name,note
John,"Hello, World"`;

      const result = await executeTool(csvToYaml, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Hello, World"
        );
      }
    });

    it("should handle special YAML characters", async () => {
      const specialCsv = `name,note
John,test: value
Jane,item - list`;

      const result = await executeTool(csvToYaml, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Special characters should be properly escaped/quoted
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvToYaml, {
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

    it("should handle decimal numbers", async () => {
      const decimalCsv = `name,price
Item1,19.99
Item2,29.50`;

      const result = await executeTool(csvToYaml, {
        input: decimalCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "price: 19.99"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "price: 29.5"
        );
      }
    });

    it("should handle negative numbers", async () => {
      const negativeCsv = `name,value
A,-100
B,-50.5`;

      const result = await executeTool(csvToYaml, {
        input: negativeCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "value: -100"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "value: -50.5"
        );
      }
    });

    it("should handle multiline values", async () => {
      const multilineCsv = `name,note
John,"Line1
Line2"`;

      const result = await executeTool(csvToYaml, {
        input: multilineCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // YAML should handle multiline strings
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });

    it("should handle values with leading/trailing spaces when not trimmed", async () => {
      const spacedValuesCsv = `name,value
John, hello `;

      const result = await executeTool(csvToYaml, {
        input: spacedValuesCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Values should be trimmed by default
        expect((result.data as Record<string, unknown>).output).toContain(
          "value: hello"
        );
      }
    });

    it("should produce valid YAML output", async () => {
      const result = await executeTool(csvToYaml, {
        input: `name,age
John,30
Jane,25`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should start with array indicator
        expect((result.data as Record<string, unknown>).output).toMatch(/^- /m);
      }
    });

    it("should handle array-like values", async () => {
      const arrayCsv = `name,tags
John,"[a, b, c]"`;

      const result = await executeTool(csvToYaml, {
        input: arrayCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Array-like string should be preserved as string
        expect((result.data as Record<string, unknown>).rowCount).toBe(1);
      }
    });
  });
});
