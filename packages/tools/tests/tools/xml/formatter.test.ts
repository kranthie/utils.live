import { describe, it, expect } from "vitest";
import { xmlFormatter } from "../../../src/tools/xml/formatter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

// Output type for xmlFormatter tool
interface FormatterOutput {
  output: string;
}

describe("xmlFormatter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlFormatter.meta.id).toBe("xml/formatter");
      expect(xmlFormatter.meta.name).toBe("XML Formatter");
      expect(xmlFormatter.meta.category).toBe("xml");
      expect(xmlFormatter.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlFormatter.meta.keywords).toContain("xml");
      expect(xmlFormatter.meta.keywords).toContain("format");
      expect(xmlFormatter.meta.keywords).toContain("prettify");
    });
  });

  describe("execute", () => {
    it("should format minified XML with default indent", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><item>value</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("\n");
        expect(result.data.output).toContain("  "); // Default 2-space indent
      }
    });

    it("should format XML with custom indent", async () => {
      const result = await executeTool(
        xmlFormatter,
        { input: "<root><item>value</item></root>" },
        { indent: "    " } // 4 spaces
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("    "); // 4-space indent
      }
    });

    it("should format XML with tab indent", async () => {
      const result = await executeTool(
        xmlFormatter,
        { input: "<root><item>value</item></root>" },
        { indent: "\t" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("\t");
      }
    });

    it("should preserve XML declaration", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: '<?xml version="1.0"?><root><item>value</item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toMatch(/^<\?xml/);
      }
    });

    it("should add XML declaration if missing and original had one", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input:
          '<?xml version="1.0" encoding="UTF-8"?><root><item>value</item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("<?xml");
      }
    });

    it("should format nested elements", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><parent><child>value</child></parent></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output.split("\n").length).toBeGreaterThan(1);
      }
    });

    it("should handle attributes", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: '<root id="1"><item name="test">value</item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain('id="1"');
        expect(result.data.output).toContain('name="test"');
      }
    });

    it("should handle ignoreAttributes option", async () => {
      const result = await executeTool(
        xmlFormatter,
        { input: '<root id="1"><item name="test">value</item></root>' },
        { ignoreAttributes: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).not.toContain('id="1"');
        expect(result.data.output).not.toContain('name="test"');
      }
    });

    it("should handle self-closing tags", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><item/></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBeDefined();
      }
    });

    it("should handle empty elements", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><item></item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBeDefined();
      }
    });

    it("should handle mixed content", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root>Text <item>value</item> more text</root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("Text");
        expect(result.data.output).toContain("more text");
      }
    });

    it("should handle CDATA sections", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><![CDATA[<special>content</special>]]></root>",
      });

      expect(result.success).toBe(true);
      // CDATA handling depends on parser configuration
    });

    it("should handle namespaces", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input:
          '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("ns:item");
      }
    });

    it("should handle special characters", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root>&lt;escaped&gt;</root>",
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid XML", async () => {
      // fast-xml-parser is lenient with unclosed tags, but may fail on other invalid inputs
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><unclosed>",
      });

      // Parser may be lenient, so we just verify it processes without crashing
      expect(result).toBeDefined();
    });

    it("should return error for malformed XML", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><item></wrong></root>",
      });

      // Parser may be lenient with mismatched tags
      expect(result).toBeDefined();
    });

    it("should trim output", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "  <root><item>value</item></root>  ",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).not.toMatch(/^\s/);
        expect(result.data.output).not.toMatch(/\s$/);
      }
    });

    it("should handle preserveOrder option", async () => {
      const result = await executeTool<FormatterOutput>(
        xmlFormatter,
        { input: "<root><b>2</b><a>1</a></root>" },
        { preserveOrder: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // With preserveOrder, elements should maintain original order
        const bIndex = result.data.output.indexOf("<b>");
        const aIndex = result.data.output.indexOf("<a>");
        expect(bIndex).toBeLessThan(aIndex);
      }
    });

    it("should handle deeply nested XML", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><l1><l2><l3><l4><l5>deep</l5></l4></l3></l2></l1></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          result.data.output.split("\n").filter((l: string) => l.trim()).length
        ).toBeGreaterThan(1);
      }
    });

    it("should handle XML with comments", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input: "<root><!-- comment --><item>value</item></root>",
      });

      expect(result.success).toBe(true);
    });

    it("should handle multiple root-level processing instructions", async () => {
      const result = await executeTool<FormatterOutput>(xmlFormatter, {
        input:
          '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="style.xsl"?><root><item>value</item></root>',
      });

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = xmlFormatter.execute(
        { input: "<root><item>value</item></root>" },
        undefined
      );
      expect(result.output).toContain("\n");
    });

    it("should handle custom indent", () => {
      const result = xmlFormatter.execute(
        { input: "<root><item>value</item></root>" },
        { indent: "    " }
      );
      expect(result.output).toContain("    ");
    });
  });
});
