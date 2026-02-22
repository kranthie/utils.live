import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract emails from"),
});

const outputSchema = z.object({
  emails: z.array(z.string()).describe("Extracted email addresses"),
  count: z.number().describe("Number of emails found"),
  unique: z.array(z.string()).describe("Unique email addresses"),
  domains: z.array(z.string()).describe("Unique domains"),
});

const optionsSchema = z.object({
  unique: z.boolean().default(true).describe("Return only unique emails"),
  lowercase: z.boolean().default(true).describe("Convert to lowercase"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

// Comprehensive email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Extracts email addresses from text.
 */
function execute(input: Input, options?: Options): Output {
  const uniqueOnly = options?.unique ?? true;
  const lowercase = options?.lowercase ?? true;

  const matches = input.input.match(EMAIL_REGEX) || [];

  let emails = lowercase ? matches.map((e) => e.toLowerCase()) : matches;

  const unique = [...new Set(emails)];
  const domains = [...new Set(unique.map((e) => e.split("@")[1] || ""))];

  if (uniqueOnly) {
    emails = unique;
  }

  return {
    emails,
    count: emails.length,
    unique,
    domains,
  };
}

/**
 * Email Extractor tool.
 * Extracts email addresses from text.
 */
export const emailExtractor = defineTool({
  meta: {
    id: "text/email-extractor",
    name: "Email Extractor",
    description:
      "Free online email extractor — find and extract email addresses from any text instantly in your browser. No data is stored. Returns unique emails, domains, and counts with optional deduplication.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["email", "extract", "address", "find", "parse"],
    examples: [
      {
        title: "Extract emails from text",
        description: "Find email addresses in a block of text",
        input:
          "Contact us at support@example.com or sales@example.com for help.",
        output:
          '{"emails":["support@example.com","sales@example.com"],"count":2,"unique":["support@example.com","sales@example.com"],"domains":["example.com"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
