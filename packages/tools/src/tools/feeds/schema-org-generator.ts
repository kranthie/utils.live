import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum([
      "Article",
      "BlogPosting",
      "Product",
      "Organization",
      "Person",
      "WebSite",
      "Event",
      "LocalBusiness",
      "Recipe",
      "VideoObject",
      "SoftwareApplication",
      "Course",
      "JobPosting",
      "Review",
    ])
    .default("Article")
    .describe("Schema.org type"),
  name: z.string().default("Example").describe("Name/title"),
  description: z.string().default("").describe("Description"),
  url: z.string().default("https://example.com").describe("URL"),
  image: z.string().optional().describe("Image URL"),
  author: z.string().optional().describe("Author name"),
  datePublished: z.string().optional().describe("Publication date (ISO 8601)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Schema.org JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": input.type,
    name: input.name,
    url: input.url,
  };

  if (input.description) jsonLd.description = input.description;
  if (input.image) jsonLd.image = input.image;

  switch (input.type) {
    case "Article":
    case "BlogPosting":
      jsonLd.headline = input.name;
      if (input.author) {
        jsonLd.author = { "@type": "Person", name: input.author };
      }
      if (input.datePublished) {
        jsonLd.datePublished = input.datePublished;
        jsonLd.dateModified = input.datePublished;
      }
      jsonLd.publisher = {
        "@type": "Organization",
        title: "Publisher Name",
        logo: { "@type": "ImageObject", url: "https://example.com/logo.png" },
      };
      break;
    case "Product":
      jsonLd.offers = {
        "@type": "Offer",
        price: "0.00",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      };
      break;
    case "Organization":
      jsonLd.contactPoint = {
        "@type": "ContactPoint",
        telephone: "+1-555-555-5555",
        contactType: "customer service",
      };
      break;
    case "Person":
      if (input.author) jsonLd.name = input.author;
      jsonLd.jobTitle = "Job Title";
      break;
    case "WebSite":
      jsonLd.potentialAction = {
        "@type": "SearchAction",
        target: `${input.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      };
      break;
    case "Event":
      jsonLd.startDate = input.datePublished ?? new Date().toISOString();
      jsonLd.location = {
        "@type": "Place",
        title: "Venue Name",
        address: { "@type": "PostalAddress", streetAddress: "123 Main St" },
      };
      break;
    case "LocalBusiness":
      jsonLd.address = {
        "@type": "PostalAddress",
        streetAddress: "123 Main St",
        addressLocality: "City",
        addressRegion: "ST",
        postalCode: "12345",
      };
      jsonLd.telephone = "+1-555-555-5555";
      break;
    case "Recipe":
      jsonLd.recipeIngredient = ["Ingredient 1", "Ingredient 2"];
      jsonLd.recipeInstructions = [
        { "@type": "HowToStep", text: "Step 1" },
        { "@type": "HowToStep", text: "Step 2" },
      ];
      jsonLd.cookTime = "PT30M";
      jsonLd.prepTime = "PT15M";
      break;
    case "VideoObject":
      jsonLd.uploadDate = input.datePublished ?? new Date().toISOString();
      jsonLd.thumbnailUrl = input.image ?? "https://example.com/thumb.jpg";
      jsonLd.contentUrl = input.url;
      break;
    case "SoftwareApplication":
      jsonLd.applicationCategory = "WebApplication";
      jsonLd.operatingSystem = "Any";
      jsonLd.offers = { "@type": "Offer", price: "0", priceCurrency: "USD" };
      break;
    case "Course":
      jsonLd.provider = { "@type": "Organization", name: "Provider Name" };
      break;
    case "JobPosting":
      jsonLd.title = input.name;
      jsonLd.datePosted = input.datePublished ?? new Date().toISOString();
      jsonLd.hiringOrganization = { "@type": "Organization", name: "Company" };
      jsonLd.jobLocation = {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: "City" },
      };
      break;
    case "Review":
      jsonLd.reviewRating = {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
      };
      if (input.author)
        jsonLd.author = { "@type": "Person", name: input.author };
      jsonLd.itemReviewed = { "@type": "Thing", name: "Reviewed Item" };
      break;
  }

  const script = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
  return { output: script };
}

export const schemaOrgGenerator = defineTool({
  meta: {
    id: "feeds/schema-org-generator",
    name: "Schema.org Generator",
    description:
      "Free online Schema.org JSON-LD generator — create structured data for Article, Product, Event, Recipe, and 10 more types instantly in your browser. No data is stored. Outputs a ready-to-embed script tag with type-specific fields.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "schema",
      "json-ld",
      "structured",
      "data",
      "seo",
      "rich",
      "snippet",
      "google",
    ],
    ui: { outputRenderer: "code", outputLanguage: "html" },
    examples: [
      {
        title: "Blog article Schema.org JSON-LD",
        description:
          "Generate Article structured data with author, publisher, and dates",
        input: {
          type: "Article" as const,
          name: "Understanding TypeScript Generics",
          description:
            "A deep dive into TypeScript generics with practical examples",
          url: "https://blog.example.com/typescript-generics",
          author: "Jane Doe",
          datePublished: "2024-03-15",
        },
        output: "Article JSON-LD with author and publisher",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
