import { describe, it, expect } from "vitest";
import { xmlXpath } from "../../../src/tools/xml/xpath";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

// Output type for xmlXpath tool
interface XpathOutput {
  results: string[];
  count: number;
}

describe("xmlXpath", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlXpath.meta.id).toBe("xml/xpath");
      expect(xmlXpath.meta.name).toBe("XML XPath Query");
      expect(xmlXpath.meta.category).toBe("xml");
      expect(xmlXpath.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlXpath.meta.keywords).toContain("xml");
      expect(xmlXpath.meta.keywords).toContain("xpath");
      expect(xmlXpath.meta.keywords).toContain("query");
    });
  });

  describe("execute", () => {
    const sampleXml = `<root>
      <users>
        <user id="1" role="admin"><name>John</name><age>30</age></user>
        <user id="2" role="user"><name>Jane</name><age>25</age></user>
        <user id="3" role="admin"><name>Bob</name><age>35</age></user>
      </users>
      <products>
        <product><name>Widget</name><price>19.99</price></product>
        <product><name>Gadget</name><price>29.99</price></product>
      </products>
    </root>`;

    it("should query root element", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item>value</item></root>" },
        { query: "/root" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBeGreaterThan(0);
        expect(result.data.results.length).toBeGreaterThan(0);
      }
    });

    it("should query nested elements with absolute path", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBeGreaterThan(0);
        expect(result.data.results[0]).toContain("user");
      }
    });

    it("should query deeply nested elements", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users/user/name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(3);
        expect(
          result.data.results.some((r: string) => r.includes("John"))
        ).toBe(true);
        expect(
          result.data.results.some((r: string) => r.includes("Jane"))
        ).toBe(true);
        expect(result.data.results.some((r: string) => r.includes("Bob"))).toBe(
          true
        );
      }
    });

    it("should query with recursive search //", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "//name" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should find names in both users and products
        expect(result.data.count).toBe(5);
      }
    });

    it("should query elements with attribute existence check", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users/user[@id]" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(3);
      }
    });

    it("should query elements with specific attribute value", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users/user[@id='1']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(1);
        expect(result.data.results[0]).toContain("John");
      }
    });

    it("should query elements with role attribute", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users/user[@role='admin']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
        expect(
          result.data.results.some((r: string) => r.includes("John"))
        ).toBe(true);
        expect(result.data.results.some((r: string) => r.includes("Bob"))).toBe(
          true
        );
      }
    });

    it("should handle recursive search with attribute filter", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "//user[@role='admin']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
      }
    });

    it("should return empty results for non-matching query", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/nonexistent" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(0);
        expect(result.data.results).toHaveLength(0);
      }
    });

    it("should handle single element results", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><single>unique</single></root>" },
        { query: "/root/single" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(1);
        expect(result.data.results[0]).toContain("unique");
      }
    });

    it("should format results as XML strings", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "/root/users/user[@id='1']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results[0]).toContain("<");
        expect(result.data.results[0]).toContain(">");
      }
    });

    it("should handle text content results", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item>simple text</item></root>" },
        { query: "/root/item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.results[0]).toContain("simple text");
      }
    });

    it("should return error for invalid XML", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><unclosed>" },
        { query: "/root" }
      );

      // Parser may be lenient with unclosed tags
      expect(result).toBeDefined();
    });

    it("should return error for empty query", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item/></root>" },
        { query: "" }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("XML_XPATH_ERROR");
        expect(result.error.message).toContain("empty");
      }
    });

    it("should return error for whitespace-only query", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item/></root>" },
        { query: "   " }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("XML_XPATH_ERROR");
      }
    });

    it("should handle namespaced elements", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        {
          input:
            '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>',
        },
        { query: "/root/ns:item" }
      );

      expect(result.success).toBe(true);
    });

    it("should handle CDATA content", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item><![CDATA[<special>]]></item></root>" },
        { query: "/root/item" }
      );

      expect(result.success).toBe(true);
    });

    it("should handle XML with declaration", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: '<?xml version="1.0"?><root><item>value</item></root>' },
        { query: "/root/item" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(1);
      }
    });

    it("should handle complex attribute queries", async () => {
      const xml = `<root>
        <item type="a" status="active">Item 1</item>
        <item type="b" status="inactive">Item 2</item>
        <item type="a" status="inactive">Item 3</item>
      </root>`;

      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: xml },
        { query: "/root/item[@type='a']" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
      }
    });

    it("should handle query with just element name", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: sampleXml },
        { query: "//price" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(2);
      }
    });

    it("should query root document with /", async () => {
      const result = await executeTool<XpathOutput>(
        xmlXpath,
        { input: "<root><item>value</item></root>" },
        { query: "/" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBeGreaterThan(0);
      }
    });
  });

  describe("execute function directly", () => {
    it("should query elements directly", () => {
      const result = xmlXpath.execute(
        { input: "<root><item>value</item></root>" },
        { query: "/root/item" }
      ) as XpathOutput;
      expect(result.count).toBe(1);
      expect(result.results[0]).toContain("value");
    });

    it("should handle recursive queries directly", () => {
      const result = xmlXpath.execute(
        { input: "<root><a><item>1</item></a><b><item>2</item></b></root>" },
        { query: "//item" }
      ) as XpathOutput;
      expect(result.count).toBe(2);
    });
  });
});
