import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  rssParser,
  atomParser,
  rssGenerator,
  atomGenerator,
  rssValidator,
  feedMerger,
  jsonFeedParser,
  opmlParser,
  schemaOrgGenerator,
  schemaOrgValidator,
  jsonLdEditor,
  microdataExtractor,
  richSnippetPreview,
  breadcrumbGenerator,
  faqSchemaGenerator,
  productSchemaGenerator,
} from "../../../src/tools/feeds";

// =====================================================
// RSS Parser
// =====================================================
describe("RSS Parser", () => {
  it("should have correct metadata", () => {
    expect(rssParser.meta.id).toBe("feeds/rss-parser");
    expect(rssParser.meta.category).toBe("feeds");
  });

  it("should parse valid RSS XML", async () => {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <link>https://example.com</link>
    <description>A test feed</description>
    <item>
      <title>Article 1</title>
      <link>https://example.com/1</link>
      <description>First article</description>
    </item>
  </channel>
</rss>`;
    const result = await executeTool(rssParser, { input: rss });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.title).toBe("Test Feed");
      expect(parsed.items).toHaveLength(1);
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(rssParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should throw on non-RSS XML", async () => {
    const result = await executeTool(rssParser, {
      input: "<html><body>Not RSS</body></html>",
    });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Atom Parser
// =====================================================
describe("Atom Parser", () => {
  it("should have correct metadata", () => {
    expect(atomParser.meta.id).toBe("feeds/atom-parser");
    expect(atomParser.meta.category).toBe("feeds");
  });

  it("should parse valid Atom XML", async () => {
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Feed</title>
  <link href="https://example.com"/>
  <entry>
    <title>Entry 1</title>
    <link href="https://example.com/1"/>
    <summary>First entry</summary>
    <updated>2024-01-01T00:00:00Z</updated>
  </entry>
</feed>`;
    const result = await executeTool(atomParser, { input: atom });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.title).toBe("Test Feed");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(atomParser, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// RSS Generator
// =====================================================
describe("RSS Generator", () => {
  it("should have correct metadata", () => {
    expect(rssGenerator.meta.id).toBe("feeds/rss-generator");
    expect(rssGenerator.meta.category).toBe("feeds");
  });

  it("should generate RSS with defaults", async () => {
    const result = await executeTool(rssGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        '<?xml version="1.0"'
      );
      expect((result.data as Record<string, unknown>).output).toContain("<rss");
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Feed"
      );
    }
  });

  it("should generate RSS with items", async () => {
    const items = JSON.stringify([
      {
        title: "Article 1",
        link: "https://example.com/1",
        description: "First",
      },
    ]);
    const result = await executeTool(rssGenerator, {
      title: "My Blog",
      link: "https://myblog.com",
      description: "My blog feed",
      items,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Blog"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Article 1"
      );
    }
  });
});

// =====================================================
// Atom Generator
// =====================================================
describe("Atom Generator", () => {
  it("should have correct metadata", () => {
    expect(atomGenerator.meta.id).toBe("feeds/atom-generator");
    expect(atomGenerator.meta.category).toBe("feeds");
  });

  it("should generate Atom feed with defaults", async () => {
    const result = await executeTool(atomGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<?xml"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "<feed"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Feed"
      );
    }
  });

  it("should generate Atom feed with entries", async () => {
    const entries = JSON.stringify([
      {
        title: "Entry 1",
        link: "https://example.com/1",
        summary: "First entry",
      },
    ]);
    const result = await executeTool(atomGenerator, {
      title: "Test Atom",
      link: "https://example.com",
      authorName: "Test Author",
      entries,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Test Atom"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Entry 1"
      );
    }
  });
});

// =====================================================
// RSS Validator
// =====================================================
describe("RSS Validator", () => {
  it("should have correct metadata", () => {
    expect(rssValidator.meta.id).toBe("feeds/rss-validator");
    expect(rssValidator.meta.category).toBe("feeds");
  });

  it("should validate a valid RSS feed", async () => {
    const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title><link>https://example.com</link><description>Test</description><item><title>Item 1</title></item></channel></rss>`;
    const result = await executeTool(rssValidator, { input: rss });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
      expect((result.data as Record<string, unknown>).stats.itemCount).toBe(1);
    }
  });

  it("should detect invalid RSS", async () => {
    const result = await executeTool(rssValidator, { input: "not xml at all" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
      expect(
        (result.data as Record<string, unknown>).errors.length
      ).toBeGreaterThan(0);
    }
  });
});

// =====================================================
// Feed Merger
// =====================================================
describe("Feed Merger", () => {
  it("should have correct metadata", () => {
    expect(feedMerger.meta.id).toBe("feeds/feed-merger");
    expect(feedMerger.meta.category).toBe("feeds");
  });

  it("should merge two feeds", async () => {
    const feed1 = JSON.stringify({ title: "Feed 1", items: [{ title: "A" }] });
    const feed2 = JSON.stringify({ title: "Feed 2", items: [{ title: "B" }] });
    const result = await executeTool(feedMerger, {
      input1: feed1,
      input2: feed2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
      const merged = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(merged.totalEntries).toBe(2);
      expect(merged.entries.length).toBe(2);
    }
  });

  it("should handle empty feeds", async () => {
    const feed1 = JSON.stringify({ title: "Feed 1", items: [] });
    const feed2 = JSON.stringify({ title: "Feed 2", items: [] });
    const result = await executeTool(feedMerger, {
      input1: feed1,
      input2: feed2,
    });
    expect(result.success).toBe(true);
  });
});

// =====================================================
// JSON Feed Parser
// =====================================================
describe("JSON Feed Parser", () => {
  it("should have correct metadata", () => {
    expect(jsonFeedParser.meta.id).toBe("feeds/json-feed-parser");
    expect(jsonFeedParser.meta.category).toBe("feeds");
  });

  it("should parse a JSON Feed", async () => {
    const feed = JSON.stringify({
      version: "https://jsonfeed.org/version/1.1",
      title: "My Feed",
      items: [{ id: "1", title: "Article", content_text: "Hello" }],
    });
    const result = await executeTool(jsonFeedParser, { input: feed });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "My Feed"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(jsonFeedParser, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// OPML Parser
// =====================================================
describe("OPML Parser", () => {
  it("should have correct metadata", () => {
    expect(opmlParser.meta.id).toBe("feeds/opml-parser");
    expect(opmlParser.meta.category).toBe("feeds");
  });

  it("should parse OPML XML", async () => {
    const opml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Subscriptions</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline text="Blog" title="Blog" type="rss" xmlUrl="https://blog.com/feed" htmlUrl="https://blog.com"/>
    </outline>
  </body>
</opml>`;
    const result = await executeTool(opmlParser, { input: opml });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Blog");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(opmlParser, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Schema.org Generator (feeds)
// =====================================================
describe("Schema.org Generator (feeds)", () => {
  it("should have correct metadata", () => {
    expect(schemaOrgGenerator.meta.id).toBe("feeds/schema-org-generator");
    expect(schemaOrgGenerator.meta.category).toBe("feeds");
  });

  it("should generate Article schema with defaults", async () => {
    const result = await executeTool(schemaOrgGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "schema.org"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Article"
      );
    }
  });

  it("should generate Product schema", async () => {
    const result = await executeTool(schemaOrgGenerator, {
      type: "Product",
      name: "Widget",
      description: "A great widget",
      url: "https://shop.example.com/widget",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Product"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Widget"
      );
    }
  });
});

// =====================================================
// Schema.org Validator
// =====================================================
describe("Schema.org Validator", () => {
  it("should have correct metadata", () => {
    expect(schemaOrgValidator.meta.id).toBe("feeds/schema-org-validator");
    expect(schemaOrgValidator.meta.category).toBe("feeds");
  });

  it("should validate valid JSON-LD", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Test Article",
      author: { "@type": "Person", name: "John" },
    });
    const result = await executeTool(schemaOrgValidator, { input: jsonLd });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).type).toBe("Article");
      expect(
        (result.data as Record<string, unknown>).properties.length
      ).toBeGreaterThan(0);
    }
  });

  it("should detect invalid JSON", async () => {
    const result = await executeTool(schemaOrgValidator, { input: "not json" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });
});

// =====================================================
// JSON-LD Editor
// =====================================================
describe("JSON-LD Editor", () => {
  it("should have correct metadata", () => {
    expect(jsonLdEditor.meta.id).toBe("feeds/json-ld-editor");
    expect(jsonLdEditor.meta.category).toBe("feeds");
  });

  it("should format JSON-LD", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      name: "Test",
    });
    const result = await executeTool(jsonLdEditor, { input: jsonLd });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "schema.org"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(jsonLdEditor, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Microdata Extractor
// =====================================================
describe("Microdata Extractor", () => {
  it("should have correct metadata", () => {
    expect(microdataExtractor.meta.id).toBe("feeds/microdata-extractor");
    expect(microdataExtractor.meta.category).toBe("feeds");
  });

  it("should extract microdata from HTML", async () => {
    const html = `<div itemscope itemtype="https://schema.org/Person">
      <span itemprop="name">John Doe</span>
    </div>`;
    const result = await executeTool(microdataExtractor, { input: html });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Person"
      );
    }
  });

  it("should handle HTML without microdata", async () => {
    const result = await executeTool(microdataExtractor, {
      input: "<div>No microdata here</div>",
    });
    expect(result.success).toBe(true);
  });
});

// =====================================================
// Rich Snippet Preview
// =====================================================
describe("Rich Snippet Preview", () => {
  it("should have correct metadata", () => {
    expect(richSnippetPreview.meta.id).toBe("feeds/rich-snippet-preview");
    expect(richSnippetPreview.meta.category).toBe("feeds");
  });

  it("should generate preview from JSON-LD", async () => {
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Test Article",
      description: "A test article",
    });
    const result = await executeTool(richSnippetPreview, { input: jsonLd });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Test Article"
      );
    }
  });

  it("should handle invalid JSON", async () => {
    const result = await executeTool(richSnippetPreview, { input: "not json" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Breadcrumb Generator
// =====================================================
describe("Breadcrumb Generator", () => {
  it("should have correct metadata", () => {
    expect(breadcrumbGenerator.meta.id).toBe("feeds/breadcrumb-generator");
    expect(breadcrumbGenerator.meta.category).toBe("feeds");
  });

  it("should generate breadcrumb JSON-LD with defaults", async () => {
    const result = await executeTool(breadcrumbGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "BreadcrumbList"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "application/ld+json"
      );
    }
  });

  it("should generate breadcrumb with custom items", async () => {
    const items = JSON.stringify([
      { name: "Home", url: "https://example.com" },
      { name: "Products", url: "https://example.com/products" },
    ]);
    const result = await executeTool(breadcrumbGenerator, { items });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Home");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Products"
      );
    }
  });
});

// =====================================================
// FAQ Schema Generator
// =====================================================
describe("FAQ Schema Generator", () => {
  it("should have correct metadata", () => {
    expect(faqSchemaGenerator.meta.id).toBe("feeds/faq-schema-generator");
    expect(faqSchemaGenerator.meta.category).toBe("feeds");
  });

  it("should generate FAQ schema with defaults", async () => {
    const result = await executeTool(faqSchemaGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "FAQPage"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Question"
      );
    }
  });

  it("should generate FAQ schema with custom FAQs", async () => {
    const faqs = JSON.stringify([{ question: "How?", answer: "Like this." }]);
    const result = await executeTool(faqSchemaGenerator, { faqs });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("How?");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Like this."
      );
    }
  });
});

// =====================================================
// Product Schema Generator
// =====================================================
describe("Product Schema Generator", () => {
  it("should have correct metadata", () => {
    expect(productSchemaGenerator.meta.id).toBe(
      "feeds/product-schema-generator"
    );
    expect(productSchemaGenerator.meta.category).toBe("feeds");
  });

  it("should generate product schema with defaults", async () => {
    const result = await executeTool(productSchemaGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Product"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "schema.org"
      );
    }
  });

  it("should generate product schema with custom data", async () => {
    const result = await executeTool(productSchemaGenerator, {
      name: "Widget Pro",
      price: "49.99",
      currency: "EUR",
      brand: "WidgetCo",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Widget Pro"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "49.99"
      );
    }
  });
});
