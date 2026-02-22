import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to add prefix/suffix to"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with prefix/suffix added"),
  linesProcessed: z.number().describe("Number of lines processed"),
});

const optionsSchema = z.object({
  prefix: z.string().default("").describe("Prefix to add to lines"),
  suffix: z.string().default("").describe("Suffix to add to lines"),
  skipEmpty: z.boolean().default(false).describe("Skip empty lines"),
  trimFirst: z.boolean().default(false).describe("Trim lines before adding"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Adds prefix and/or suffix to lines.
 */
function execute(input: Input, options?: Options): Output {
  const prefix = options?.prefix ?? "";
  const suffix = options?.suffix ?? "";
  const skipEmpty = options?.skipEmpty ?? false;
  const trimFirst = options?.trimFirst ?? false;

  const lines = input.input.split(/\r?\n/);
  let processedCount = 0;

  const processed = lines.map((line) => {
    const processedLine = trimFirst ? line.trim() : line;

    if (skipEmpty && processedLine.length === 0) {
      return processedLine;
    }

    processedCount++;
    return `${prefix}${processedLine}${suffix}`;
  });

  return {
    output: processed.join("\n"),
    linesProcessed: processedCount,
  };
}

/**
 * Prefix/Suffix Adder tool.
 * Adds text to start/end of lines.
 */
export const prefixSuffixAdder = defineTool({
  meta: {
    id: "text/prefix-suffix-adder",
    name: "Prefix/Suffix Adder",
    description:
      "Free online prefix/suffix adder — prepend or append text to every line instantly in your browser. No data is stored. Supports custom prefix and suffix strings, empty line skipping, and line trimming.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["prefix", "suffix", "prepend", "append", "lines"],
    examples: [
      {
        title: "Add prefix/suffix to lines",
        description: "Add custom text before and after each line",
        input: "apple\nbanana\ncherry",
        output: "apple\nbanana\ncherry",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
