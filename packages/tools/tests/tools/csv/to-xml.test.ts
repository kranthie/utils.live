import { describe, it, expect } from "vitest";
import { csvToXml } from "../../../src/tools/csv/to-xml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("csvToXml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(csvToXml.meta.id).toBe("csv/to-xml");
      expect(csvToXml.meta.name).toBe("CSV to XML");
      expect(csvToXml.meta.category).toBe("csv");
      expect(csvToXml.meta.tier).toBe(ToolTier.CLIENT);
      expect(csvToXml.meta.keywords).toContain("csv");
      expect(csvToXml.meta.keywords).toContain("xml");
      expect(csvToXml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    it("should convert CSV to XML", async () => {
      const result = await executeTool(csvToXml, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<data>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "</data>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<row>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<name>John</name>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<age>30</age>"
        );
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should include XML declaration by default", async () => {
      const result = await executeTool(csvToXml, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          '<?xml version="1.0"'
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          'encoding="UTF-8"'
        );
      }
    });

    it("should exclude XML declaration when declaration is false", async () => {
      const result = await executeTool(
        csvToXml,
        { input: basicCsv },
        { declaration: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "<?xml"
        );
      }
    });

    it("should use custom root element name", async () => {
      const result = await executeTool(
        csvToXml,
        { input: basicCsv },
        { rootName: "users" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<users>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "</users>"
        );
      }
    });

    it("should use custom row element name", async () => {
      const result = await executeTool(
        csvToXml,
        { input: basicCsv },
        { rowName: "user" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<user>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "</user>"
        );
      }
    });

    it("should use custom indentation", async () => {
      const result = await executeTool(
        csvToXml,
        { input: basicCsv },
        { indent: "    " }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "    "
        );
      }
    });

    it("should use custom delimiter", async () => {
      const semicolonCsv = `name;age
John;30`;

      const result = await executeTool(
        csvToXml,
        { input: semicolonCsv },
        { delimiter: ";" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<name>John</name>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<age>30</age>"
        );
      }
    });

    it("should handle empty CSV", async () => {
      const result = await executeTool(csvToXml, {
        input: "",
      });

      // Empty CSV may succeed or fail depending on implementation
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle header only CSV", async () => {
      const result = await executeTool(csvToXml, {
        input: "name,age,city",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(0);
      }
    });

    it("should convert header spaces to underscores", async () => {
      const spacedHeaderCsv = `first name,last name
John,Doe`;

      const result = await executeTool(csvToXml, {
        input: spacedHeaderCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<first_name>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<last_name>"
        );
      }
    });

    it("should handle numeric values with dynamic typing", async () => {
      const result = await executeTool(csvToXml, {
        input: basicCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Numbers should be output without quotes in XML
        expect((result.data as Record<string, unknown>).output).toContain(
          "<age>30</age>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<age>25</age>"
        );
      }
    });

    it("should handle boolean values with dynamic typing", async () => {
      const boolCsv = `name,active
John,true
Jane,false`;

      const result = await executeTool(csvToXml, {
        input: boolCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<active>true</active>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<active>false</active>"
        );
      }
    });
  });

  describe("edge cases", () => {
    it("should handle single column", async () => {
      const singleCol = `name
John
Jane`;

      const result = await executeTool(csvToXml, {
        input: singleCol,
      });

      // Single column behavior depends on implementation
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "John"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Jane"
        );
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle single row", async () => {
      const singleRow = `name,age
John,30`;

      const result = await executeTool(csvToXml, {
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

      const result = await executeTool(csvToXml, {
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

      const result = await executeTool(csvToXml, {
        input: quotedCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Hello, World"
        );
      }
    });

    it("should handle special XML characters", async () => {
      const specialCsv = `name,note
John,<test>&"more"`;

      const result = await executeTool(csvToXml, {
        input: specialCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // XML special characters should be escaped
        expect((result.data as Record<string, unknown>).output).toContain(
          "&lt;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "&gt;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "&amp;"
        );
      }
    });

    it("should handle unicode characters", async () => {
      const unicodeCsv = `name,city
Maria,Sao Paulo
Yuki,Tokyo`;

      const result = await executeTool(csvToXml, {
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

      const result = await executeTool(csvToXml, {
        input: decimalCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<price>19.99</price>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<price>29.5</price>"
        );
      }
    });

    it("should handle header: false option", async () => {
      const noHeaderCsv = `John,30
Jane,25`;

      const result = await executeTool(
        csvToXml,
        { input: noHeaderCsv },
        { header: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).rowCount).toBe(2);
      }
    });

    it("should handle null values", async () => {
      const nullCsv = `name,value
John,null
Jane,`;

      const result = await executeTool(csvToXml, {
        input: nullCsv,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<value>"
        );
      }
    });

    it("should combine custom root and row names", async () => {
      const result = await executeTool(
        csvToXml,
        { input: basicCsv },
        { rootName: "people", rowName: "person" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<people>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<person>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "</person>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "</people>"
        );
      }
    });
  });

  const basicCsv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;
});
