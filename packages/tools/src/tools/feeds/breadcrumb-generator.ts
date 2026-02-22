import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  items: z
    .string()
    .default(
      '[{"name":"Home","url":"https://example.com"},{"name":"Category","url":"https://example.com/cat"},{"name":"Page","url":"https://example.com/cat/page"}]'
    )
    .describe("JSON array of breadcrumb items with name and url"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated breadcrumb JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let items: Array<{ name: string; url: string }>;

  try {
    items = JSON.parse(input.items) as Array<{ name: string; url: string }>;
    if (!Array.isArray(items)) {
      throw new Error("Items must be an array");
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error("Invalid JSON in items field");
    }
    throw e;
  }

  if (items.length === 0) {
    throw new Error("At least one breadcrumb item is required");
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const script = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
  return { output: script };
}

export const breadcrumbGenerator = defineTool({
  meta: {
    id: "feeds/breadcrumb-generator",
    name: "Breadcrumb Generator",
    description:
      "Free online breadcrumb JSON-LD generator — create BreadcrumbList structured data for SEO instantly in your browser. No data is stored. Outputs a ready-to-embed script tag with Schema.org-compliant ListItem elements.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "breadcrumb",
      "json-ld",
      "schema",
      "navigation",
      "seo",
      "structured",
      "data",
    ],
    ui: { outputRenderer: "code", outputLanguage: "html" },
    examples: [
      {
        title: "Product page breadcrumb path",
        description:
          "Generate BreadcrumbList JSON-LD for a 3-level product page navigation",
        input: {
          items:
            '[{"name":"Home","url":"https://shop.example.com"},{"name":"Electronics","url":"https://shop.example.com/electronics"},{"name":"Laptops","url":"https://shop.example.com/electronics/laptops"}]',
        },
        output: "BreadcrumbList JSON-LD with 3 items",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
