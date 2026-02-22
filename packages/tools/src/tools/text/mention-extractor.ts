import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract mentions from"),
});

const outputSchema = z.object({
  mentions: z.array(z.string()).describe("Extracted mentions (with @)"),
  usernames: z.array(z.string()).describe("Usernames without @"),
  count: z.number().describe("Number of mentions found"),
  unique: z.array(z.string()).describe("Unique mentions"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique mentions"),
  lowercase: z.boolean().default(false).describe("Convert to lowercase"),
  includeAt: z.boolean().default(true).describe("Include @ in output"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// Mention regex (letters, numbers, underscore, starting with @)
const MENTION_REGEX = /@[a-zA-Z][a-zA-Z0-9_]*/g;

/**
 * Extracts @mentions from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const lowercase = options?.lowercase ?? false;
  const includeAt = options?.includeAt ?? true;

  const matches = input.input.match(MENTION_REGEX) || [];

  let mentions = lowercase ? matches.map((m) => m.toLowerCase()) : matches;

  const unique = [...new Set(mentions)];
  const usernames = unique.map((m) => m.slice(1)); // Remove @

  if (uniqueOnly) {
    mentions = unique;
  }

  if (!includeAt) {
    mentions = mentions.map((m) => m.slice(1));
  }

  return {
    mentions,
    usernames,
    count: mentions.length,
    unique,
  };
}

/**
 * Mention Extractor tool.
 * Extracts @mentions from text.
 */
export const mentionExtractor = defineTool({
  meta: {
    id: "text/mention-extractor",
    name: "Mention Extractor",
    description:
      "Free online mention extractor — find and extract @mentions from social media text instantly in your browser. No data is stored. Returns unique mentions, usernames without @, and total counts.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["mention", "extract", "username", "at", "social"],
    examples: [
      {
        title: "Extract mentions from post",
        description: "Find @mentions in social media text",
        input:
          "Great work @alice and @bob! Thanks @alice for leading the project.",
        output:
          '{"mentions":["@alice","@bob"],"usernames":["alice","bob"],"count":2,"unique":["@alice","@bob"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
