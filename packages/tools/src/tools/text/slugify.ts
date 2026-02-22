import { z } from "zod";
import slugifyLib from "slugify";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to slugify"),
});

const outputSchema = z.object({
  output: z.string().describe("URL-friendly slug"),
  original: z.string().describe("Original text"),
  length: z.number().describe("Length of generated slug"),
});

const optionsSchema = z.object({
  separator: z.string().default("-").describe("Separator character"),
  lowercase: z.boolean().default(true).describe("Convert to lowercase"),
  strict: z.boolean().default(true).describe("Strip special characters"),
  trim: z.boolean().default(true).describe("Trim separator from ends"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts text to URL-friendly slug.
 */
function execute(input: Input, options?: Options): Output {
  const separator = options?.separator ?? "-";
  const lowercase = options?.lowercase ?? true;
  const strict = options?.strict ?? true;
  const trim = options?.trim ?? true;

  const output = slugifyLib(input.input, {
    replacement: separator,
    lower: lowercase,
    strict,
    trim,
  });

  return {
    output,
    original: input.input,
    length: output.length,
  };
}

/**
 * Slugify tool.
 * Generates URL-friendly slugs from text.
 */
export const slugify = defineTool({
  meta: {
    id: "text/slugify",
    name: "Slugify",
    description:
      "Free online slugify tool — convert text to URL-friendly slugs instantly in your browser. No data is stored. Supports custom separators, Unicode/accent handling, and strict mode for special characters.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["slug", "url", "seo", "permalink", "friendly"],
    examples: [
      {
        title: "Blog Post Title",
        description: "Convert an article title to a URL-friendly slug",
        input: "How to Build REST APIs with Node.js",
        output: "how-to-build-rest-apis-with-nodejs",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
