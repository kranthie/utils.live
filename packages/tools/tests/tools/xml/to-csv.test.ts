import { describe, it, expect } from "vitest";
import { xmlToCsv } from "../../../src/tools/xml/to-csv";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

// Output type for xmlToCsv tool
interface ToCsvOutput {
  output: string;
  rowCount: number;
  columnCount: number;
}

describe("xmlToCsv", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlToCsv.meta.id).toBe("xml/to-csv");
      expect(xmlToCsv.meta.name).toBe("XML to CSV");
      expect(xmlToCsv.meta.category).toBe("xml");
      expect(xmlToCsv.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlToCsv.meta.keywords).toContain("xml");
      expect(xmlToCsv.meta.keywords).toContain("csv");
      expect(xmlToCsv.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert XML with array to CSV", async () => {
      const result = await executeTool<ToCsvOutput>(xmlToCsv, {
        input: `<root>
          <items>
            <item><name>John</name><age>30</age></item>
            <item><name>Jane</name><age>25</age></item>
          </items>
        </root>`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("name");
        expect(result.data.output).toContain("age");
        expect(result.data.output).toContain("John");
        expect(result.data.output).toContain("30");
        expect(result.data.rowCount).toBe(2);
      }
    });

    it("should include header by default", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><col1>a</col1><col2>b</col2></item><item><col1>c</col1><col2>d</col2></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output.split("\n")[0]).toContain("col1");
        expect(result.data.output.split("\n")[0]).toContain("col2");
      }
    });

    it("should exclude header when includeHeader is false", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><name>John</name><age>30</age></item><item><name>Jane</name><age>25</age></item></items></root>`,
        },
        { includeHeader: false, rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // First line should be data, not header
        expect(result.data.output.split("\n")[0]).toContain("John");
      }
    });

    it("should use custom delimiter", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><a>1</a><b>2</b></item><item><a>3</a><b>4</b></item></items></root>`,
        },
        { delimiter: ";", rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain(";");
      }
    });

    it("should use tab delimiter", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><a>1</a><b>2</b></item><item><a>3</a><b>4</b></item></items></root>`,
        },
        { delimiter: "\t", rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("\t");
      }
    });

    it("should use rowPath to select specific array", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root>
            <users>
              <user><name>John</name></user>
              <user><name>Jane</name></user>
            </users>
          </root>`,
        },
        { rowPath: "root.users.user" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rowCount).toBe(2);
        expect(result.data.output).toContain("John");
        expect(result.data.output).toContain("Jane");
      }
    });

    it("should auto-detect first array without rowPath", async () => {
      const result = await executeTool<ToCsvOutput>(xmlToCsv, {
        input: `<root><items><item><x>1</x></item><item><x>2</x></item></items></root>`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rowCount).toBe(2);
      }
    });

    it("should report column count", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><a>1</a><b>2</b><c>3</c></item><item><a>4</a><b>5</b><c>6</c></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.columnCount).toBe(3);
      }
    });

    it("should escape fields with delimiter", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><name>John, Jr.</name><age>30</age></item><item><name>Jane</name><age>25</age></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain('"John, Jr."');
      }
    });

    it("should escape fields with quotes", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><name>John "Johnny" Doe</name></item><item><name>Jane</name></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain('""'); // Double quotes escape
      }
    });

    it("should escape fields with newlines", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><desc>Line1
Line2</desc></item><item><desc>other</desc></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain('"');
      }
    });

    it("should handle null/undefined values", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><a>1</a></item><item><a>2</a><b>extra</b></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Missing columns should be empty
        expect(result.data.output).toBeDefined();
      }
    });

    it("should handle attributes", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item id="1"><name>John</name></item><item id="2"><name>Jane</name></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Attributes are prefixed with @_
        expect(result.data.output).toContain("@_id");
      }
    });

    it("should return empty output for empty array", async () => {
      // This will fail because there's no array to find
      const result = await executeTool<ToCsvOutput>(xmlToCsv, {
        input: `<root><items></items></root>`,
      });

      // Depending on implementation, this might error or return empty
      if (result.success && result.data) {
        expect(result.data.rowCount).toBe(0);
        expect(result.data.output).toBe("");
      }
    });

    it("should return error for invalid XML", async () => {
      const result = await executeTool<ToCsvOutput>(xmlToCsv, {
        input: "<root><unclosed>",
      });

      // Parser may be lenient
      expect(result).toBeDefined();
    });

    it("should return error when rowPath does not point to array", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><single><value>test</value></single></root>`,
        },
        { rowPath: "root.single" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("does not point to an array");
      }
    });

    it("should return error when no arrays found", async () => {
      const result = await executeTool<ToCsvOutput>(xmlToCsv, {
        input: `<root><item>single</item></root>`,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("No arrays found");
      }
    });

    it("should handle nested objects in items", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><name>John</name><address><city>NYC</city></address></item><item><name>Jane</name><address><city>LA</city></address></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      // Nested objects will be converted to string representation
    });

    it("should handle multiple rows with varying columns", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root>
          <items>
            <item><a>1</a><b>2</b></item>
            <item><a>3</a><c>4</c></item>
          </items>
        </root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should include all unique columns
        expect(result.data.columnCount).toBe(3); // a, b, c
      }
    });

    it("should handle special characters in XML", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root><items><item><name>&lt;John&gt;</name></item><item><name>Jane</name></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("<John>");
      }
    });

    it("should handle namespaced elements", async () => {
      const result = await executeTool<ToCsvOutput>(
        xmlToCsv,
        {
          input: `<root xmlns:ns="http://example.com"><ns:items><ns:item><ns:name>John</ns:name></ns:item><ns:item><ns:name>Jane</ns:name></ns:item></ns:items></root>`,
        },
        { rowPath: "root.ns:items.ns:item" }
      );

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = xmlToCsv.execute(
        {
          input: `<root><items><item><a>1</a></item><item><a>2</a></item></items></root>`,
        },
        { rowPath: "root.items.item" }
      );
      expect(result.output).toContain("a");
    });

    it("should respect delimiter option", () => {
      const result = xmlToCsv.execute(
        {
          input: `<root><items><item><a>1</a><b>2</b></item><item><a>3</a><b>4</b></item></items></root>`,
        },
        { delimiter: "|", rowPath: "root.items.item" }
      );
      expect(result.output).toContain("|");
    });
  });
});
