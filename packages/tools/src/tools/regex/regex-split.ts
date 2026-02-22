import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to split"),
});

const optionsSchema = z.object({
  pattern: z.string().default(",\\s*").describe("Regex pattern to split on"),
  flags: z.string().default("").describe("Regex flags"),
  limit: z
    .number()
    .min(0)
    .max(10000)
    .default(0)
    .describe("Maximum splits (0 = unlimited)"),
});

const outputSchema = z.object({
  output: z.string().describe("Split parts, one per line"),
  parts: z.array(z.string()).describe("Array of split parts"),
  count: z.number().describe("Number of resulting parts"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? ",\\s*";
  const flags = options?.flags ?? "";
  const limit = options?.limit ?? 0;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  const parts =
    limit > 0 ? input.input.split(regex, limit) : input.input.split(regex);

  return {
    output: parts.map((p, i) => `[${i}]: ${p}`).join("\n"),
    parts,
    count: parts.length,
  };
}

export const regexSplit = defineTool({
  meta: {
    id: "regex/regex-split",
    name: "Regex Split",
    description:
      "Free online regex text splitter — split text into parts using regular expression delimiters instantly in your browser. No data is stored. Supports custom flags and configurable result limits.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "split",
      "divide",
      "separate",
      "tokenize",
      "parse",
      "delimiter",
      "separator",
    ],
    examples: [
      {
        title: "Split comma-separated values",
        description: "Split a comma-separated line into individual values",
        input: "John, 30, New York, Engineer",
        output: "[0]: John\n[1]: 30\n[2]: New York\n[3]: Engineer",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
