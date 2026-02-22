import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract hashtags from"),
});

const outputSchema = z.object({
  hashtags: z.array(z.string()).describe("Extracted hashtags (with #)"),
  tags: z.array(z.string()).describe("Tags without #"),
  count: z.number().describe("Number of hashtags found"),
  unique: z.array(z.string()).describe("Unique hashtags"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique hashtags"),
  lowercase: z.boolean().default(false).describe("Convert to lowercase"),
  includeHash: z.boolean().default(true).describe("Include # in output"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// Hashtag regex (letters, numbers, underscore)
const HASHTAG_REGEX = /#[a-zA-Z][a-zA-Z0-9_]*/g;

/**
 * Extracts hashtags from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const lowercase = options?.lowercase ?? false;
  const includeHash = options?.includeHash ?? true;

  const matches = input.input.match(HASHTAG_REGEX) || [];

  let hashtags = lowercase ? matches.map((h) => h.toLowerCase()) : matches;

  const unique = [...new Set(hashtags)];
  const tags = unique.map((h) => h.slice(1)); // Remove #

  if (uniqueOnly) {
    hashtags = unique;
  }

  if (!includeHash) {
    hashtags = hashtags.map((h) => h.slice(1));
  }

  return {
    hashtags,
    tags,
    count: hashtags.length,
    unique,
  };
}

/**
 * Hashtag Extractor tool.
 * Extracts hashtags from text.
 */
export const hashtagExtractor = defineTool({
  meta: {
    id: "text/hashtag-extractor",
    name: "Hashtag Extractor",
    description:
      "Free online hashtag extractor — find and extract hashtags from social media text instantly in your browser. No data is stored. Returns unique hashtags, tags without #, and total counts.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["hashtag", "extract", "tag", "social", "twitter"],
    examples: [
      {
        title: "Extract hashtags from a post",
        description: "Pull out hashtags from social media text",
        input:
          "Just launched our new feature! #ProductUpdate #WebDev #Launch2024",
        output:
          '{"hashtags":["#ProductUpdate","#WebDev","#Launch2024"],"tags":["ProductUpdate","WebDev","Launch2024"],"count":3,"unique":["#ProductUpdate","#WebDev","#Launch2024"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
