import { describe, it, expect } from "vitest";
import { markdownTocGenerator } from "../../../src/tools/markdown/toc-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("markdownTocGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownTocGenerator.meta.id).toBe("markdown/toc-generator");
      expect(markdownTocGenerator.meta.name).toBe("Markdown TOC Generator");
      expect(markdownTocGenerator.meta.category).toBe("markdown");
      expect(markdownTocGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownTocGenerator.meta.keywords).toContain("toc");
      expect(markdownTocGenerator.meta.keywords).toContain("table of contents");
    });
  });

  describe("execute", () => {
    it("should generate TOC from headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Title\n## Section 1\n## Section 2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toContain(
          "[Title]"
        );
        expect((result.data as Record<string, unknown>).toc).toContain(
          "[Section 1]"
        );
        expect((result.data as Record<string, unknown>).toc).toContain(
          "[Section 2]"
        );
        expect((result.data as Record<string, unknown>).headings).toHaveLength(
          3
        );
      }
    });

    it("should extract heading details", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Main Title\n## Subsection",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          headings: Array<{ level: number; text: string; slug: string }>;
        };
        expect(data.headings[0]).toEqual({
          level: 1,
          text: "Main Title",
          slug: "main-title",
        });
        expect(data.headings[1]).toEqual({
          level: 2,
          text: "Subsection",
          slug: "subsection",
        });
      }
    });

    it("should generate proper slugs", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Hello World!\n## My Section Here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        expect(data.headings[0]?.slug).toBe("hello-world");
        expect(data.headings[1]?.slug).toBe("my-section-here");
      }
    });

    it("should handle special characters in slugs", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Test @#$% Section",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        // Special characters are removed, resulting in "test-section"
        expect(data.headings[0]?.slug).toBe("test-section");
      }
    });

    it("should use unordered list by default", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Title\n## Section",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toContain("- [");
      }
    });

    it("should use ordered list when option is set", async () => {
      const result = await executeTool(
        markdownTocGenerator,
        { input: "# Title\n## Section" },
        { ordered: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toMatch(/^\d+\./m);
      }
    });

    it("should respect maxDepth option", async () => {
      const result = await executeTool(
        markdownTocGenerator,
        { input: "# H1\n## H2\n### H3\n#### H4" },
        { maxDepth: 2 }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).headings).toHaveLength(
          2
        );
        expect((result.data as Record<string, unknown>).toc).toContain("H1");
        expect((result.data as Record<string, unknown>).toc).toContain("H2");
        expect((result.data as Record<string, unknown>).toc).not.toContain(
          "H3"
        );
        expect((result.data as Record<string, unknown>).toc).not.toContain(
          "H4"
        );
      }
    });

    it("should apply link prefix", async () => {
      const result = await executeTool(
        markdownTocGenerator,
        { input: "# Title" },
        { linkPrefix: "/docs" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toContain(
          "/docs#title"
        );
      }
    });

    it("should indent nested headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# H1\n## H2\n### H3",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { toc: string };
        const lines = data.toc.split("\n");
        expect(lines[0]).not.toMatch(/^\s/);
        expect(lines[1]).toMatch(/^\s{2}/);
        expect(lines[2]).toMatch(/^\s{4}/);
      }
    });

    it("should ignore headings inside code blocks", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Real Heading\n```\n# Not a heading\n```\n## Another Real",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ text: string }> };
        expect(data.headings).toHaveLength(2);
        expect(data.headings[0]?.text).toBe("Real Heading");
        expect(data.headings[1]?.text).toBe("Another Real");
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toBe("");
        expect((result.data as Record<string, unknown>).headings).toHaveLength(
          0
        );
      }
    });

    it("should handle input without headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "Just plain text without any headings.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toBe("");
        expect((result.data as Record<string, unknown>).headings).toHaveLength(
          0
        );
      }
    });

    it("should remove inline formatting from headings for slug", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# **Bold** and *italic* heading",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        expect(data.headings[0]?.slug).toBe("bold-and-italic-heading");
      }
    });

    it("should remove inline code from headings for slug", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Using `code` in heading",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        // Inline code is removed, multiple dashes collapsed to single dash
        expect(data.headings[0]?.slug).toBe("using-in-heading");
      }
    });

    it("should handle links in headings for slug", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Check [this link](https://example.com) out",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        expect(data.headings[0]?.slug).toBe("check-this-link-out");
      }
    });

    it("should handle all heading levels", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ level: number }> };
        expect(data.headings).toHaveLength(6);
        expect(data.headings[0]?.level).toBe(1);
        expect(data.headings[5]?.level).toBe(6);
      }
    });

    it("should handle trailing hashes in headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# Title ###",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ text: string }> };
        expect(data.headings[0]?.text).toBe("Title");
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Introduction

Some text here.

## Getting Started

More content.

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

Settings here.

## API Reference

### Methods

#### \`doSomething()\`

Method description.

## Contributing

How to contribute.`;

      const result = await executeTool(markdownTocGenerator, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: unknown[]; toc: string };
        expect(data.headings.length).toBeGreaterThan(5);
        expect(data.toc).toContain("Introduction");
        expect(data.toc).toContain("Getting Started");
        expect(data.toc).toContain("Installation");
        expect(data.toc).toContain("API Reference");
        expect(data.toc).toContain("Contributing");
      }
    });

    it("should handle strikethrough in headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# ~~Old~~ New Section",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        expect(data.headings[0]?.slug).toBe("old-new-section");
      }
    });

    it("should handle underscore italic in headings", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# A _special_ section",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { headings: Array<{ slug: string }> };
        expect(data.headings[0]?.slug).toBe("a-special-section");
      }
    });

    it("should generate proper anchor links", async () => {
      const result = await executeTool(markdownTocGenerator, {
        input: "# My Section",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).toc).toContain(
          "(#my-section)"
        );
      }
    });

    it("should combine all options", async () => {
      const result = await executeTool(
        markdownTocGenerator,
        { input: "# Title\n## Section\n### Sub\n#### Deep" },
        { maxDepth: 3, ordered: true, linkPrefix: "/page" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).headings).toHaveLength(
          3
        );
        expect((result.data as Record<string, unknown>).toc).toMatch(/^\d+\./m);
        expect((result.data as Record<string, unknown>).toc).toContain(
          "/page#"
        );
      }
    });
  });
});
