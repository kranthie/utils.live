import { describe, it, expect } from "vitest";
import { xmlEscape } from "../../../src/tools/xml/escape";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

// Output type for xmlEscape tool
interface EscapeOutput {
  output: string;
}

describe("xmlEscape", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(xmlEscape.meta.id).toBe("xml/escape");
      expect(xmlEscape.meta.name).toBe("XML Escape");
      expect(xmlEscape.meta.category).toBe("xml");
      expect(xmlEscape.meta.tier).toBe(ToolTier.CLIENT);
      expect(xmlEscape.meta.keywords).toContain("xml");
      expect(xmlEscape.meta.keywords).toContain("escape");
      expect(xmlEscape.meta.keywords).toContain("encode");
    });
  });

  describe("execute", () => {
    it("should escape ampersand", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "Tom & Jerry",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("Tom &amp; Jerry");
      }
    });

    it("should escape less-than sign", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "a < b",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("a &lt; b");
      }
    });

    it("should escape greater-than sign", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "a > b",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("a &gt; b");
      }
    });

    it("should escape double quotes by default", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: 'She said "hello"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("She said &quot;hello&quot;");
      }
    });

    it("should escape single quotes by default", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "It's working",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("It&apos;s working");
      }
    });

    it("should escape all special characters together", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: '<tag attr="value">Tom & Jerry\'s</tag>',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe(
          "&lt;tag attr=&quot;value&quot;&gt;Tom &amp; Jerry&apos;s&lt;/tag&gt;"
        );
      }
    });

    it("should not escape quotes when escapeQuotes is false", async () => {
      const result = await executeTool(
        xmlEscape,
        { input: 'She said "hello"' },
        { escapeQuotes: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe('She said "hello"');
      }
    });

    it("should not escape single quotes when escapeQuotes is false", async () => {
      const result = await executeTool(
        xmlEscape,
        { input: "It's working" },
        { escapeQuotes: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("It's working");
      }
    });

    it("should not escape newlines by default", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "line1\nline2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("line1\nline2");
      }
    });

    it("should escape newlines when escapeNewlines is true", async () => {
      const result = await executeTool(
        xmlEscape,
        { input: "line1\nline2" },
        { escapeNewlines: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("line1&#10;line2");
      }
    });

    it("should escape carriage returns when escapeNewlines is true", async () => {
      const result = await executeTool(
        xmlEscape,
        { input: "line1\r\nline2" },
        { escapeNewlines: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("line1&#13;&#10;line2");
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("");
      }
    });

    it("should handle input with no special characters", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "Hello World 123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("Hello World 123");
      }
    });

    it("should handle multiple consecutive special characters", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "<<<>>>",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("&lt;&lt;&lt;&gt;&gt;&gt;");
      }
    });

    it("should handle Unicode characters", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "Hello & Caf\u00e9",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe("Hello &amp; Caf\u00e9");
      }
    });

    it("should handle already escaped entities", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "&amp;",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // The ampersand in &amp; gets escaped
        expect(result.data.output).toBe("&amp;amp;");
      }
    });

    it("should handle numeric character references", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "&#60;",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // The ampersand gets escaped
        expect(result.data.output).toBe("&amp;#60;");
      }
    });

    it("should combine multiple options", async () => {
      const result = await executeTool(
        xmlEscape,
        { input: '<tag>\n"value"</tag>' },
        { escapeQuotes: true, escapeNewlines: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toBe(
          "&lt;tag&gt;&#10;&quot;value&quot;&lt;/tag&gt;"
        );
      }
    });

    it("should handle large input", async () => {
      const largeInput = "<tag>&</tag>".repeat(1000);
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: largeInput,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.output).toContain("&lt;tag&gt;&amp;&lt;/tag&gt;");
        expect(result.data.output.length).toBeGreaterThan(largeInput.length);
      }
    });

    it("should handle tabs", async () => {
      const result = await executeTool<EscapeOutput>(xmlEscape, {
        input: "col1\tcol2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Tabs are not escaped by default
        expect(result.data.output).toBe("col1\tcol2");
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default options when undefined", () => {
      const result = xmlEscape.execute({ input: '<a "b">' }, undefined);
      expect(result.output).toBe("&lt;a &quot;b&quot;&gt;");
    });

    it("should respect escapeQuotes option", () => {
      const result = xmlEscape.execute(
        { input: '"quote"' },
        { escapeQuotes: false }
      );
      expect(result.output).toBe('"quote"');
    });

    it("should respect escapeNewlines option", () => {
      const result = xmlEscape.execute(
        { input: "a\nb" },
        { escapeNewlines: true }
      );
      expect(result.output).toBe("a&#10;b");
    });
  });
});
