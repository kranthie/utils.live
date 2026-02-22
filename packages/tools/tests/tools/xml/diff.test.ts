import { describe, it, expect } from "vitest";
import { xmlDiff } from "../../../src/tools/xml/diff";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

// Output type for xmlDiff tool
interface XmlDiffOutput {
  identical: boolean;
  differences: Array<{
    path: string;
    type: "added" | "removed" | "changed" | "type_changed";
    oldValue?: unknown;
    newValue?: unknown;
  }>;
  summary: {
    added: number;
    removed: number;
    changed: number;
    total: number;
  };
}

describe("xmlDiff", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlDiff.meta.id).toBe("xml/diff");
      expect(xmlDiff.meta.name).toBe("XML Diff");
      expect(xmlDiff.meta.category).toBe("xml");
      expect(xmlDiff.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlDiff.meta.keywords).toContain("xml");
      expect(xmlDiff.meta.keywords).toContain("diff");
      expect(xmlDiff.meta.keywords).toContain("compare");
    });
  });

  describe("execute", () => {
    it("should identify identical XML documents", async () => {
      const xml = "<root><item>value</item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml,
        input2: xml,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(true);
        expect(result.data.differences).toHaveLength(0);
        expect(result.data.summary.total).toBe(0);
      }
    });

    it("should detect added elements", async () => {
      const xml1 = "<root><item>value</item></root>";
      const xml2 = "<root><item>value</item><extra>new</extra></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.summary.added).toBeGreaterThan(0);
      }
    });

    it("should detect removed elements", async () => {
      const xml1 = "<root><item>value</item><extra>old</extra></root>";
      const xml2 = "<root><item>value</item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.summary.removed).toBeGreaterThan(0);
      }
    });

    it("should detect changed values", async () => {
      const xml1 = "<root><item>old value</item></root>";
      const xml2 = "<root><item>new value</item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.summary.changed).toBeGreaterThan(0);
      }
    });

    it("should detect type changes", async () => {
      const xml1 = "<root><item>text</item></root>";
      const xml2 = "<root><item><nested>value</nested></item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.differences.length).toBeGreaterThan(0);
      }
    });

    it("should handle attributes", async () => {
      const xml1 = '<root><item id="1">value</item></root>';
      const xml2 = '<root><item id="2">value</item></root>';
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.summary.changed).toBeGreaterThan(0);
      }
    });

    it("should compare nested structures", async () => {
      const xml1 = "<root><parent><child>value1</child></parent></root>";
      const xml2 = "<root><parent><child>value2</child></parent></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        const changedDiff = result.data.differences.find(
          (d: { type: string }) => d.type === "changed"
        );
        expect(changedDiff).toBeDefined();
      }
    });

    it("should handle arrays in XML", async () => {
      const xml1 = "<root><items><item>a</item><item>b</item></items></root>";
      const xml2 =
        "<root><items><item>a</item><item>b</item><item>c</item></items></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
        expect(result.data.summary.added).toBeGreaterThan(0);
      }
    });

    it("should provide correct summary counts", async () => {
      const xml1 = "<root><a>1</a><b>2</b></root>";
      const xml2 = "<root><a>changed</a><c>3</c></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary.total).toBe(
          result.data.summary.added +
            result.data.summary.removed +
            result.data.summary.changed
        );
      }
    });

    it("should return error for invalid XML in first input", async () => {
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: "<invalid xml",
        input2: "<root></root>",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("XML_PARSE_ERROR");
        expect(result.error.message).toContain("first input");
      }
    });

    it("should return error for invalid XML in second input", async () => {
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: "<root></root>",
        input2: "<invalid xml",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("XML_PARSE_ERROR");
        expect(result.error.message).toContain("second input");
      }
    });

    it("should handle empty root elements", async () => {
      const xml1 = "<root></root>";
      const xml2 = "<root></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(true);
      }
    });

    it("should handle self-closing tags", async () => {
      const xml1 = "<root><item/></root>";
      const xml2 = "<root><item></item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Self-closing and empty tags should be equivalent
        expect(result.data.identical).toBe(true);
      }
    });

    it("should handle XML with namespaces", async () => {
      const xml1 =
        '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>';
      const xml2 =
        '<root xmlns:ns="http://example.com"><ns:item>different</ns:item></root>';
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
      }
    });

    it("should handle CDATA sections", async () => {
      const xml1 = "<root><![CDATA[some data]]></root>";
      const xml2 = "<root><![CDATA[different data]]></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(false);
      }
    });

    it("should handle special characters in content", async () => {
      const xml1 = "<root><item>&lt;special&gt;</item></root>";
      const xml2 = "<root><item>&lt;special&gt;</item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.identical).toBe(true);
      }
    });

    it("should handle whitespace trimming", async () => {
      const xml1 = "<root><item>  value  </item></root>";
      const xml2 = "<root><item>value</item></root>";
      const result = await executeTool<XmlDiffOutput>(xmlDiff, {
        input1: xml1,
        input2: xml2,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // With trimValues: true, whitespace should be trimmed
        expect(result.data.identical).toBe(true);
      }
    });
  });

  describe("execute function directly", () => {
    it("should work without executor wrapper", () => {
      const result = xmlDiff.execute({
        input1: "<root><a>1</a></root>",
        input2: "<root><a>2</a></root>",
      }) as XmlDiffOutput;

      expect(result.identical).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
    });
  });
});
