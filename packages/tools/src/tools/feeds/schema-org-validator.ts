import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON-LD structured data to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the JSON-LD is valid"),
  type: z.string().optional().describe("Detected Schema.org type"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Validation warnings"),
  properties: z.array(z.string()).describe("Found properties"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const REQUIRED_FIELDS: Record<string, string[]> = {
  Article: ["headline", "author", "datePublished"],
  BlogPosting: ["headline", "author", "datePublished"],
  Product: ["name", "offers"],
  Organization: ["name"],
  Person: ["name"],
  WebSite: ["name", "url"],
  Event: ["name", "startDate", "location"],
  LocalBusiness: ["name", "address"],
  Recipe: ["name", "recipeIngredient"],
  VideoObject: ["name", "uploadDate", "thumbnailUrl"],
  Review: ["reviewRating", "author", "itemReviewed"],
  JobPosting: ["title", "datePosted", "hiringOrganization"],
  Course: ["name", "provider"],
  SoftwareApplication: ["name", "offers"],
  FAQPage: ["mainEntity"],
  BreadcrumbList: ["itemListElement"],
};

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let rawInput = input.input.trim();

  // Extract JSON from script tags if present
  const scriptMatch = rawInput.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (scriptMatch) {
    rawInput = scriptMatch[1]!.trim();
  }

  let jsonLd: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawInput) as Record<string, unknown>;
    if (Array.isArray(parsed)) {
      jsonLd = parsed[0] as Record<string, unknown>;
    } else {
      jsonLd = parsed;
    }
  } catch {
    return {
      valid: false,
      errors: ["Invalid JSON: Could not parse input"],
      warnings: [],
      properties: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check @context
  const context = jsonLd["@context"] as string | undefined;
  if (!context) {
    errors.push("Missing '@context' property");
  } else if (!context.includes("schema.org")) {
    warnings.push(`Non-standard @context: ${context}`);
  }

  // Check @type
  const type = jsonLd["@type"] as string | undefined;
  if (!type) {
    errors.push("Missing '@type' property");
  }

  // Check required fields
  if (type && REQUIRED_FIELDS[type]) {
    for (const field of REQUIRED_FIELDS[type]) {
      if (!(field in jsonLd) && !(field === "name" && "headline" in jsonLd)) {
        errors.push(`Missing recommended field '${field}' for type '${type}'`);
      }
    }
  }

  // Collect properties
  const properties = Object.keys(jsonLd).filter((k) => !k.startsWith("@"));

  // Check for empty values
  for (const [key, value] of Object.entries(jsonLd)) {
    if (key.startsWith("@")) continue;
    if (value === "" || value === null || value === undefined) {
      warnings.push(`Empty value for property '${key}'`);
    }
  }

  // Check URL fields
  const urlFields = ["url", "image", "thumbnailUrl", "contentUrl", "logo"];
  for (const field of urlFields) {
    const val = jsonLd[field];
    if (typeof val === "string" && val && !val.startsWith("http")) {
      warnings.push(`'${field}' should be a full URL (starts with http/https)`);
    }
  }

  // Check date fields
  const dateFields = [
    "datePublished",
    "dateModified",
    "dateCreated",
    "startDate",
    "endDate",
    "uploadDate",
  ];
  for (const field of dateFields) {
    const val = jsonLd[field];
    if (typeof val === "string" && val) {
      const d = new Date(val);
      if (isNaN(d.getTime())) {
        errors.push(`Invalid date format in '${field}': ${val}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    type,
    errors,
    warnings,
    properties,
  };
}

export const schemaOrgValidator = defineTool({
  meta: {
    id: "feeds/schema-org-validator",
    name: "Schema.org Validator",
    description:
      "Free online Schema.org validator — paste JSON-LD and check for missing required fields, invalid dates, and structural issues instantly in your browser. No data is stored. Validates @context, @type, and type-specific required properties.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "schema",
      "json-ld",
      "validate",
      "structured",
      "data",
      "seo",
      "check",
    ],
    ui: { outputRenderer: "json-tree" },
    examples: [
      {
        title: "Validate Product JSON-LD",
        description:
          "Check a Product schema for required fields (name, offers) and structural validity",
        input:
          '{"@context":"https://schema.org","@type":"Product","name":"Laptop","offers":{"@type":"Offer","price":"999","priceCurrency":"USD"}}',
        output: "Valid Product schema with 2 properties",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
