import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract matches from"),
});

const optionsSchema = z.object({
  pattern: z.string().default("\\b\\w+\\b").describe("Regex pattern"),
  flags: z.string().default("g").describe("Regex flags"),
  unique: z.boolean().default(false).describe("Return only unique matches"),
});

const outputSchema = z.object({
  output: z.string().describe("Extracted matches, one per line"),
  matches: z.array(z.string()).describe("Array of matched strings"),
  count: z.number().describe("Number of matches"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? "\\b\\w+\\b";
  const flags = options?.flags ?? "g";
  const unique = options?.unique ?? false;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  let matches: string[] = [];

  if (flags.includes("g")) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(input.input)) !== null) {
      matches.push(m[0]);
      if (m[0].length === 0) regex.lastIndex++;
    }
  } else {
    const m = regex.exec(input.input);
    if (m) matches.push(m[0]);
  }

  if (unique) {
    matches = [...new Set(matches)];
  }

  return {
    output: matches.length > 0 ? matches.join("\n") : "(no matches)",
    matches,
    count: matches.length,
  };
}

export const regexExtract = defineTool({
  meta: {
    id: "regex/regex-extract",
    name: "Regex Extract",
    description:
      "Free online regex match extractor — find and extract all pattern matches from text instantly in your browser. No data is stored. Supports global, case-insensitive, and unique-only matching.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "extract",
      "find all",
      "matches",
      "capture",
      "find",
      "search",
      "scan",
    ],
    examples: [
      {
        title: "Extract email addresses from text",
        description: "Extract all email addresses from a block of text",
        input: "Contact john@example.com or jane@example.com for help",
        options: { pattern: "[\\w.-]+@[\\w.-]+\\.\\w+", flags: "g" },
        output: "john@example.com\njane@example.com",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
