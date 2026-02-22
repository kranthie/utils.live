import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("URL slug to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const slugValidator = defineTool({
  meta: {
    id: "validation/slug-validator",
    name: "Slug Validator",
    description:
      "Free online URL slug validator — check if a string is a valid URL-friendly slug instantly in your browser. No data is stored. Validates lowercase letters, numbers, and hyphens per SEO best practices.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "slug",
      "url",
      "validate",
      "seo",
      "friendly",
      "permalink",
      "hyphen",
      "lowercase",
    ],
    examples: [
      {
        title: "Valid Slug",
        description: "Validate a well-formed URL slug",
        input: "my-awesome-blog-post",
        output: "Valid slug: my-awesome-blog-post",
      },
      {
        title: "Invalid Slug",
        description: "Detect issues in a slug with uppercase and spaces",
        input: "My Blog Post",
        output:
          "Invalid slug: Should be lowercase; Should not contain spaces; Should only contain lowercase letters, numbers, and hyphens",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const slug = input.input.trim();
    const errors: string[] = [];
    if (!slug) errors.push("Slug is empty");
    if (/[A-Z]/.test(slug)) errors.push("Should be lowercase");
    if (/\s/.test(slug)) errors.push("Should not contain spaces");
    if (/[^a-z0-9-]/.test(slug))
      errors.push(
        "Should only contain lowercase letters, numbers, and hyphens"
      );
    if (slug.startsWith("-") || slug.endsWith("-"))
      errors.push("Should not start or end with a hyphen");
    if (slug.includes("--"))
      errors.push("Should not contain consecutive hyphens");
    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid slug: ${slug}`
        : `Invalid slug: ${errors.join("; ")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
