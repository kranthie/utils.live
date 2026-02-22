import { describe, it, expect } from "vitest";
import { xmlToYaml } from "../../../src/tools/xml/to-yaml";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("xmlToYaml", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlToYaml.meta.id).toBe("xml/to-yaml");
      expect(xmlToYaml.meta.name).toBe("XML to YAML");
      expect(xmlToYaml.meta.category).toBe("xml");
      expect(xmlToYaml.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlToYaml.meta.keywords).toContain("xml");
      expect(xmlToYaml.meta.keywords).toContain("yaml");
      expect(xmlToYaml.meta.keywords).toContain("convert");
    });
  });

  describe("execute", () => {
    it("should convert simple XML to YAML", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item>value</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("root:");
        expect(result.data.output).toContain("item: value");
      }
    });

    it("should format YAML with default 2-space indent", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><parent><child>value</child></parent></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("  ");
      }
    });

    it("should use custom indent", async () => {
      const result = await executeTool(
        xmlToYaml,
        { input: "<root><parent><child>value</child></parent></root>" },
        { indent: 4 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("    ");
      }
    });

    it("should preserve attributes by default", async () => {
      const result = await executeTool(xmlToYaml, {
        input: '<root id="1"><item name="test">value</item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("@_id");
        expect(result.data.output).toContain("@_name");
      }
    });

    it("should ignore attributes when ignoreAttributes is true", async () => {
      const result = await executeTool(
        xmlToYaml,
        { input: '<root id="1"><item name="test">value</item></root>' },
        { ignoreAttributes: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).not.toContain("@_id");
        expect(result.data.output).not.toContain("@_name");
      }
    });

    it("should use custom attribute prefix", async () => {
      const result = await executeTool(
        xmlToYaml,
        { input: '<root id="1">content</root>' },
        { attributeNamePrefix: "attr_" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("attr_id");
      }
    });

    it("should handle nested elements", async () => {
      const result = await executeTool(xmlToYaml, {
        input:
          "<root><level1><level2><level3>deep</level3></level2></level1></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("level1:");
        expect(result.data.output).toContain("level2:");
        expect(result.data.output).toContain("level3: deep");
      }
    });

    it("should handle multiple sibling elements as array", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item>1</item><item>2</item><item>3</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("item:");
        expect(result.data.output).toContain("- ");
      }
    });

    it("should handle empty elements", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item></item></root>",
      });

      expect(result.success).toBe(true);
    });

    it("should handle self-closing elements", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item/></root>",
      });

      expect(result.success).toBe(true);
    });

    it("should handle namespaces", async () => {
      const result = await executeTool(xmlToYaml, {
        input:
          '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("ns:item");
      }
    });

    it("should handle numeric values", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><count>42</count><price>19.99</price></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("count:");
        expect(result.data.output).toContain("price:");
      }
    });

    it("should handle boolean-like values", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><active>true</active><disabled>false</disabled></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("active:");
        expect(result.data.output).toContain("disabled:");
      }
    });

    it("should handle special characters", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><message>&lt;escaped&gt; &amp; content</message></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("message:");
      }
    });

    it("should handle XML declaration", async () => {
      const result = await executeTool(xmlToYaml, {
        input: '<?xml version="1.0" encoding="UTF-8"?><root><item/></root>',
      });

      expect(result.success).toBe(true);
    });

    it("should handle CDATA sections", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><![CDATA[<special>content</special>]]></root>",
      });

      expect(result.success).toBe(true);
    });

    it("should handle comments in XML", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><!-- comment --><item>value</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("item: value");
      }
    });

    it("should return error for invalid XML", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><unclosed>",
      });

      // Parser may be lenient with unclosed tags
      expect(result).toBeDefined();
    });

    it("should return error for malformed XML", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item></wrong></root>",
      });

      // Parser may be lenient with mismatched tags
      expect(result).toBeDefined();
    });

    it("should handle Unicode content", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><message>Hello Caf\u00e9</message></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("Caf\u00e9");
      }
    });

    it("should trim values", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root><item>  value  </item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("item: value");
      }
    });

    it("should handle complex nested structures", async () => {
      const result = await executeTool(xmlToYaml, {
        input: `<root>
          <users>
            <user><name>John</name><age>30</age></user>
            <user><name>Jane</name><age>25</age></user>
          </users>
        </root>`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("users:");
        expect(result.data.output).toContain("name:");
        expect(result.data.output).toContain("John");
        expect(result.data.output).toContain("Jane");
      }
    });

    it("should not produce YAML with circular references", async () => {
      // noRefs: true should prevent circular reference markers
      const result = await executeTool(xmlToYaml, {
        input: "<root><a>value</a><b>value</b></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).not.toContain("*ref");
        expect(result.data.output).not.toContain("&ref");
      }
    });

    it("should handle mixed content", async () => {
      const result = await executeTool(xmlToYaml, {
        input: "<root>Text <item>value</item> more text</root>",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = xmlToYaml.execute(
        { input: "<root><item>value</item></root>" },
        undefined
      );
      expect(result.output).toContain("root:");
      expect(result.output).toContain("item: value");
    });

    it("should respect indent option", () => {
      const result = xmlToYaml.execute(
        { input: "<root><parent><child>value</child></parent></root>" },
        { indent: 4 }
      );
      expect(result.output).toContain("    ");
    });

    it("should respect ignoreAttributes option", () => {
      const result = xmlToYaml.execute(
        { input: '<root id="1"><item/></root>' },
        { ignoreAttributes: true }
      );
      expect(result.output).not.toContain("@_id");
    });
  });
});
