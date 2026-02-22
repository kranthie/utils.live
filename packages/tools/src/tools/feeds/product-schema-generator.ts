import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  name: z.string().default("Product Name").describe("Product name"),
  description: z
    .string()
    .default("Product description")
    .describe("Product description"),
  image: z
    .string()
    .default("https://example.com/product.jpg")
    .describe("Product image URL"),
  brand: z.string().default("Brand Name").describe("Brand name"),
  price: z.string().default("29.99").describe("Product price"),
  currency: z.string().default("USD").describe("Currency code (ISO 4217)"),
  availability: z
    .enum(["InStock", "OutOfStock", "PreOrder", "Discontinued"])
    .default("InStock")
    .describe("Product availability"),
  sku: z.string().optional().describe("Product SKU"),
  ratingValue: z.string().optional().describe("Average rating (e.g., 4.5)"),
  reviewCount: z.string().optional().describe("Number of reviews"),
  url: z
    .string()
    .default("https://example.com/product")
    .describe("Product URL"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Product Schema.org JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image,
    url: input.url,
    brand: {
      "@type": "Brand",
      name: input.brand,
    },
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      availability: `https://schema.org/${input.availability}`,
      url: input.url,
    },
  };

  if (input.sku) jsonLd.sku = input.sku;

  if (input.ratingValue) {
    const aggregateRating: Record<string, unknown> = {
      "@type": "AggregateRating",
      ratingValue: input.ratingValue,
      bestRating: "5",
    };
    if (input.reviewCount) {
      aggregateRating.reviewCount = input.reviewCount;
    }
    jsonLd.aggregateRating = aggregateRating;
  }

  const script = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
  return { output: script };
}

export const productSchemaGenerator = defineTool({
  meta: {
    id: "feeds/product-schema-generator",
    name: "Product Schema Generator",
    description:
      "Free online Product Schema generator — create Product JSON-LD structured data with offers, brand, and ratings for Google rich results instantly in your browser. No data is stored. Supports pricing, availability, SKU, and aggregate ratings.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "product",
      "schema",
      "json-ld",
      "ecommerce",
      "seo",
      "shopping",
      "offer",
      "price",
    ],
    ui: { outputRenderer: "code", outputLanguage: "html" },
    examples: [
      {
        title: "E-commerce product listing schema",
        description:
          "Generate Product JSON-LD for wireless headphones with brand and pricing",
        input: {
          title: "Wireless Headphones",
          description: "Noise-canceling Bluetooth headphones",
          brand: "AudioTech",
          price: "79.99",
          currency: "USD",
          availability: "InStock" as const,
          url: "https://shop.example.com/headphones",
          image: "https://shop.example.com/headphones.jpg",
        },
        output: "Product JSON-LD with offers and brand",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
