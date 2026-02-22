import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to perform replacement on"),
});

const optionsSchema = z.object({
  pattern: z.string().default("\\w+").describe("Regex pattern to search for"),
  replacement: z
    .string()
    .default("")
    .describe("Replacement string (supports $1, $2, etc.)"),
  flags: z.string().default("g").describe("Regex flags"),
});

const outputSchema = z.object({
  output: z.string().describe("Text after replacement"),
  replacements: z.number().describe("Number of replacements made"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? "\\w+";
  const replacement = options?.replacement ?? "";
  const flags = options?.flags ?? "g";

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  // Count replacements by running the regex separately
  let replacements = 0;
  const countRegex = new RegExp(pattern, flags);
  input.input.replace(countRegex, () => {
    replacements++;
    return "";
  });

  // Use native replace which properly handles $1, $2, $&, etc.
  const result = input.input.replace(regex, replacement);

  return {
    output: result,
    replacements,
  };
}

export const regexReplace = defineTool({
  meta: {
    id: "regex/regex-replace",
    name: "Regex Replace",
    description:
      "Free online regex find and replace — search text with regular expressions and replace matches with custom patterns instantly in your browser. No data is stored. Supports capture group references ($1, $2) in replacement strings.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "replace",
      "find",
      "substitute",
      "search",
      "sed",
      "transform",
      "rewrite",
    ],
    examples: [
      {
        title: "Reformat dates from YYYY-MM-DD to MM/DD/YYYY",
        description:
          "Convert dates from YYYY-MM-DD to MM/DD/YYYY format using regex replace",
        input: "Date: 2024-01-15 and 2024-12-31",
        options: {
          pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
          replacement: "$2/$3/$1",
          flags: "g",
        },
        output: "Date: 01/15/2024 and 12/31/2024",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
