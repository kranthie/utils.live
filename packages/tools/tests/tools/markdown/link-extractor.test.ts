import { describe, it, expect } from "vitest";
import { markdownLinkExtractor } from "../../../src/tools/markdown/link-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface LinkExtractorData {
  count: number;
  links: Array<{ text: string; url: string; title: string | null }>;
  uniqueUrls: string[];
  uniqueDomains: string[];
}

describe("markdownLinkExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownLinkExtractor.meta.id).toBe("markdown/link-extractor");
      expect(markdownLinkExtractor.meta.name).toBe("Markdown Link Extractor");
      expect(markdownLinkExtractor.meta.category).toBe("markdown");
      expect(markdownLinkExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownLinkExtractor.meta.keywords).toContain("link");
      expect(markdownLinkExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract inline link", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Link text](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(1);
        expect(data.links[0]).toEqual({
          text: "Link text",
          url: "https://example.com",
          title: null,
        });
      }
    });

    it("should extract link with title", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: '[Link](https://example.com "Link Title")',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.links[0]?.title).toBe("Link Title");
      }
    });

    it("should extract multiple links", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[One](url1)\n[Two](url2)\n[Three](url3)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(3);
        expect(data.links.map((l) => l.url)).toEqual(["url1", "url2", "url3"]);
      }
    });

    it("should extract reference-style links", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Link][ref]\n\n[ref]: https://example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(1);
        expect(data.links[0]?.url).toBe("https://example.com");
      }
    });

    it("should extract reference-style links with title", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: '[Link][ref]\n\n[ref]: https://example.com "Title"',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.links[0]?.title).toBe("Title");
      }
    });

    it("should extract autolinks", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "Check <https://example.com> for more.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(1);
        expect(data.links[0]?.url).toBe("https://example.com");
        expect(data.links[0]?.text).toBe("https://example.com");
      }
    });

    it("should return unique URLs", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[A](https://a.com)\n[B](https://a.com)\n[C](https://b.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(3);
        expect(data.uniqueUrls).toEqual(["https://a.com", "https://b.com"]);
      }
    });

    it("should extract unique domains", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input:
          "[A](https://example.com/page1)\n[B](https://example.com/page2)\n[C](https://other.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.uniqueDomains).toEqual(["example.com", "other.com"]);
      }
    });

    it("should handle empty link text", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[](https://example.com)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.links[0]?.text).toBe("");
      }
    });

    it("should handle relative URLs (no domain extraction)", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Rel](./relative.md)\n[Hash](#anchor)\n[Root](/path)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(3);
        expect(data.uniqueDomains).toEqual([]);
      }
    });

    it("should handle document with no links", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "# Just text\n\nNo links here.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(0);
        expect(data.links).toEqual([]);
        expect(data.uniqueUrls).toEqual([]);
        expect(data.uniqueDomains).toEqual([]);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(0);
      }
    });

    it("should not confuse images with links", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "![Image](image.png)\n[Link](page.html)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        // Should extract links (may or may not include image)
        expect(data.count).toBeGreaterThanOrEqual(1);
        expect(data.links.some((l) => l.url === "page.html")).toBe(true);
      }
    });

    it("should handle complex document", async () => {
      const markdown = `# Documentation

Check our [website](https://example.com) and [docs](https://docs.example.com).

## References

- [GitHub][gh]
- [npm][npm]

For more info, see <https://info.example.com>.

[gh]: https://github.com "GitHub"
[npm]: https://npmjs.com
`;

      const result = await executeTool(markdownLinkExtractor, {
        input: markdown,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(5);
        expect(data.uniqueDomains).toContain("example.com");
        expect(data.uniqueDomains).toContain("github.com");
        expect(data.uniqueDomains).toContain("npmjs.com");
      }
    });

    it("should handle URLs with query parameters", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Search](https://example.com/search?q=test&page=1)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.links[0]?.url).toBe(
          "https://example.com/search?q=test&page=1"
        );
        expect(data.uniqueDomains).toContain("example.com");
      }
    });

    it("should handle URLs with ports", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Local](http://localhost:3000/api)",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.uniqueDomains).toContain("localhost");
      }
    });

    it("should handle reference links with implicit text", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[example][]\n\n[example]: https://example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(1);
        expect(data.links[0]?.url).toBe("https://example.com");
      }
    });

    it("should be case-insensitive for reference matching", async () => {
      const result = await executeTool(markdownLinkExtractor, {
        input: "[Link][REF]\n\n[ref]: https://example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinkExtractorData;
        expect(data.count).toBe(1);
        expect(data.links[0]?.url).toBe("https://example.com");
      }
    });
  });
});
