import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum([
      "Article",
      "Product",
      "Organization",
      "Person",
      "LocalBusiness",
      "Event",
      "BreadcrumbList",
      "FAQ",
      "HowTo",
      "Recipe",
    ])
    .default("Article")
    .describe("Schema.org type"),
  name: z.string().default("Example Name").describe("Name/title"),
  description: z
    .string()
    .default("A brief description")
    .describe("Description"),
  url: z.string().default("https://example.com").describe("URL"),
  image: z
    .string()
    .default("https://example.com/image.jpg")
    .describe("Image URL"),
  author: z.string().default("").describe("Author name"),
  datePublished: z.string().default("").describe("Date published (ISO 8601)"),
  dateModified: z.string().default("").describe("Date modified (ISO 8601)"),
  extraFields: z
    .string()
    .default("")
    .describe("Extra JSON fields (e.g., 'price: 29.99, currency: USD')"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Schema.org JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": input.type,
    name: input.name,
    description: input.description,
    url: input.url,
  };

  if (input.image) {
    schema.image = input.image;
  }

  if (input.author) {
    schema.author = {
      "@type": "Person",
      name: input.author,
    };
  }

  if (input.datePublished) {
    schema.datePublished = input.datePublished;
  }

  if (input.dateModified) {
    schema.dateModified = input.dateModified;
  }

  // Type-specific fields
  switch (input.type) {
    case "Article":
      schema.headline = input.name;
      if (!schema.author) {
        schema.publisher = {
          "@type": "Organization",
          name: "Publisher Name",
        };
      }
      break;
    case "Product":
      break;
    case "Organization":
    case "LocalBusiness":
      schema.logo = input.image;
      break;
  }

  // Parse extra fields
  if (input.extraFields.trim()) {
    const pairs = input.extraFields.split(",").map((p) => p.trim());
    for (const pair of pairs) {
      const colonIdx = pair.indexOf(":");
      if (colonIdx > 0) {
        const key = pair.substring(0, colonIdx).trim();
        const value = pair.substring(colonIdx + 1).trim();
        // Try to parse numbers
        const num = Number(value);
        schema[key] = isNaN(num) ? value : num;
      }
    }
  }

  const jsonLd = JSON.stringify(schema, null, 2);
  const output = `<script type="application/ld+json">\n${jsonLd}\n</script>`;

  return { output };
}

export const schemaOrgGenerator = defineTool({
  meta: {
    id: "web/schema-org-generator",
    name: "Schema.org Generator",
    description:
      "Free online Schema.org JSON-LD generator — create structured data markup for articles, products, organizations, events, and more instantly in your browser. No data is stored. Outputs ready-to-paste script tags for rich search results.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "schema.org",
      "json-ld",
      "structured data",
      "seo",
      "generator",
      "rich snippets",
      "rich-snippets",
      "google",
      "search-results",
      "markup",
      "article",
      "product",
      "organization",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "Article structured data with author and date",
        description:
          "Generate JSON-LD for a blog article with author, publish date, and image",
        input: {
          type: "Article",
          name: "How to Build a REST API",
          description: "Step-by-step guide to building RESTful APIs",
          url: "https://example.com/blog/rest-api",
          image: "https://example.com/images/rest-api.jpg",
          author: "Jane Developer",
          datePublished: "2025-01-15",
          dateModified: "",
          extraFields: "",
        },
        output: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "name": "How to Build a REST API",\n  "description": "Step-by-step guide to building RESTful APIs",\n  "url": "https://example.com/blog/rest-api",\n  "image": "https://example.com/images/rest-api.jpg",\n  "author": {\n    "@type": "Person",\n    "name": "Jane Developer"\n  },\n  "datePublished": "2025-01-15",\n  "headline": "How to Build a REST API"\n}\n</script>`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
