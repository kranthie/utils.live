import { describe, it, expect } from "vitest";
import { asciidocToMd } from "../../../src/tools/markdown/asciidoc-to-md";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("asciidocToMd", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(asciidocToMd.meta.id).toBe("markdown/asciidoc-to-md");
      expect(asciidocToMd.meta.name).toBe("AsciiDoc to Markdown");
      expect(asciidocToMd.meta.category).toBe("markdown");
      expect(asciidocToMd.meta.tier).toBe(ToolTier.CLIENT);
      expect(asciidocToMd.meta.keywords).toContain("asciidoc");
      expect(asciidocToMd.meta.keywords).toContain("markdown");
    });
  });

  describe("execute", () => {
    it("should convert document title", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "= Document Title",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "# Document Title"
        );
      }
    });

    it("should convert section headers", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "== Section\n=== Subsection\n==== Sub-subsection",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Section"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Subsection"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "#### Sub-subsection"
        );
      }
    });

    it("should convert bold text", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "This is **bold** text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
      }
    });

    it("should convert italic text", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "This is __italic__ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "*italic*"
        );
      }
    });

    it("should convert monospace text with +", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "This is +code+ text",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "`code`"
        );
      }
    });

    it("should convert links with text", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "Check https://example.com[this link]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Link text and URL should be present
        expect((result.data as Record<string, unknown>).output).toContain(
          "this link"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "https://example.com"
        );
      }
    });

    it("should convert link: syntax", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "See link:/docs/guide[the guide]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "[the guide](/docs/guide)"
        );
      }
    });

    it("should convert images", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "image::logo.png[Logo]",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "![Logo](logo.png)"
        );
      }
    });

    it("should convert unordered lists", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "* Item 1\n* Item 2\n** Nested item",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "  - Nested item"
        );
      }
    });

    it("should convert ordered lists", async () => {
      const result = await executeTool(asciidocToMd, {
        input: ". First\n. Second\n.. Nested",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. First"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. Second"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "  1. Nested"
        );
      }
    });

    it("should convert checklists", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "[*] Checked\n[ ] Unchecked",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [x]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [ ]"
        );
      }
    });

    it("should convert source code blocks", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "[source,javascript]\n----\nconst x = 1;\n----",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "```javascript"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "const x = 1;"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
      }
    });

    it("should convert admonitions", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "NOTE: This is a note\nTIP: This is a tip\nWARNING: Be careful",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "> **Note:** This is a note"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "> **Tip:** This is a tip"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "> **Warning:** Be careful"
        );
      }
    });

    it("should convert horizontal rules", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "Before\n''''\nAfter",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "---"
        );
      }
    });

    it("should convert blockquotes", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "[quote, Author]\n____\nThis is a quote\n____",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Quote content and author should be present
        expect((result.data as Record<string, unknown>).output).toContain(
          "This is a quote"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Author"
        );
      }
    });

    it("should convert subscript and superscript", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "H~2~O and E=mc^2^",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "<sub>2</sub>"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "<sup>2</sup>"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should preserve plain text without conversion", async () => {
      const result = await executeTool(asciidocToMd, {
        input: "Just plain text without any formatting",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Just plain text without any formatting"
        );
      }
    });

    it("should handle complex documents", async () => {
      const complexDoc = `= My Document

== Introduction

This is **bold** and __italic__.

* Item 1
* Item 2

[source,python]
----
print("Hello")
----

NOTE: Important note here.
`;

      const result = await executeTool(asciidocToMd, {
        input: complexDoc,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# My Document"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Introduction"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**bold**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "*italic*"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```python"
        );
      }
    });
  });
});
