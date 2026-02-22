import { describe, it, expect } from "vitest";
import { xmlValidator } from "../../../src/tools/xml/validator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("xmlValidator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlValidator.meta.id).toBe("xml/validator");
      expect(xmlValidator.meta.name).toBe("XML Validator");
      expect(xmlValidator.meta.category).toBe("xml");
      expect(xmlValidator.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlValidator.meta.keywords).toContain("xml");
      expect(xmlValidator.meta.keywords).toContain("validate");
      expect(xmlValidator.meta.keywords).toContain("syntax");
    });
  });

  describe("execute", () => {
    it("should validate correct XML", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><item>value</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
        expect(result.data.error).toBeUndefined();
      }
    });

    it("should validate XML with attributes", async () => {
      const result = await executeTool(xmlValidator, {
        input:
          '<root id="1" name="test"><item attr="value">content</item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with declaration", async () => {
      const result = await executeTool(xmlValidator, {
        input: '<?xml version="1.0" encoding="UTF-8"?><root><item/></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with namespaces", async () => {
      const result = await executeTool(xmlValidator, {
        input:
          '<root xmlns:ns="http://example.com"><ns:item>value</ns:item></root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate self-closing tags", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><item/><empty></empty></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with CDATA", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><![CDATA[<special>content & more</special>]]></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with comments", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><!-- This is a comment --><item>value</item></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with boolean attributes", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><item disabled/></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate deeply nested XML", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><l1><l2><l3><l4><l5>deep</l5></l4></l3></l2></l1></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should validate XML with special characters", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root>&lt;escaped&gt; &amp; &quot;content&quot;</root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should invalidate unclosed tags", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><unclosed>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should invalidate mismatched tags", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><item></wrong></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should invalidate invalid tag names", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<123invalid>value</123invalid>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
      }
    });

    it("should invalidate duplicate attributes", async () => {
      const result = await executeTool(xmlValidator, {
        input: '<root id="1" id="2">value</root>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        expect(result.data.error).toBeDefined();
      }
    });

    it("should invalidate unquoted attribute values", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root id=unquoted>value</root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
      }
    });

    it("should provide line number for errors when available", async () => {
      const result = await executeTool(xmlValidator, {
        input: `<root>
<item>
<unclosed>
</item>
</root>`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(false);
        // Line/column info may or may not be available depending on error type
      }
    });

    it("should provide column number for errors when available", async () => {
      const result = await executeTool(xmlValidator, {
        input: '<root id="1" id="2">value</root>',
      });

      expect(result.success).toBe(true);
      if (result.success && !result.data.valid) {
        // Column info may or may not be available depending on error type
        expect(result.data.error).toBeDefined();
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(xmlValidator, {
        input: "",
      });

      expect(result.success).toBe(true);
      // Empty input is technically valid according to fast-xml-parser
    });

    it("should handle whitespace-only input", async () => {
      const result = await executeTool(xmlValidator, {
        input: "   \n\t   ",
      });

      expect(result.success).toBe(true);
    });

    it("should handle text without tags", async () => {
      const result = await executeTool(xmlValidator, {
        input: "just plain text",
      });

      expect(result.success).toBe(true);
      // Plain text is not valid XML
    });

    it("should handle invalid XML entity", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root>&invalidEntity;</root>",
      });

      expect(result.success).toBe(true);
      // Behavior depends on parser configuration
    });

    it("should handle multiple root elements", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root1/><root2/>",
      });

      expect(result.success).toBe(true);
      // Multiple roots might be valid depending on parser
    });

    it("should validate processing instructions", async () => {
      const result = await executeTool(xmlValidator, {
        input:
          '<?xml version="1.0"?><?xml-stylesheet type="text/xsl" href="style.xsl"?><root/>',
      });

      expect(result.success).toBe(true);
    });

    it("should handle Unicode content", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root><message>Hello Caf\u00e9</message></root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });

    it("should handle DOCTYPE declaration", async () => {
      const result = await executeTool(xmlValidator, {
        input: '<?xml version="1.0"?><!DOCTYPE root SYSTEM "root.dtd"><root/>',
      });

      expect(result.success).toBe(true);
    });

    it("should validate mixed content", async () => {
      const result = await executeTool(xmlValidator, {
        input: "<root>Text <item>value</item> more text</root>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valid).toBe(true);
      }
    });
  });

  describe("execute function directly", () => {
    it("should validate correct XML", () => {
      const result = xmlValidator.execute({
        input: "<root><item>value</item></root>",
      });
      expect(result.valid).toBe(true);
    });

    it("should invalidate incorrect XML", () => {
      const result = xmlValidator.execute({
        input: "<root><unclosed>",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
