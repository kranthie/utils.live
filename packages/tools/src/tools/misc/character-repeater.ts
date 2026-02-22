import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String to repeat"),
});
const optionsSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(1000)
    .default(3)
    .describe("Number of repetitions"),
  separator: z.string().default("").describe("Separator between repetitions"),
});
const outputSchema = z.object({
  output: z.string().describe("Repeated string"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  if (!input.input) throw new Error("Input cannot be empty");
  const count = options?.count ?? 3;
  const sep = options?.separator ?? "";
  return { output: Array(count).fill(input.input).join(sep) };
}

export const characterRepeater = defineTool({
  meta: {
    id: "misc/character-repeater",
    name: "Character Repeater",
    description:
      "Free online string repeater — repeat any text or character N times instantly in your browser. No data is stored. Configurable repeat count (up to 1000) and custom separator between repetitions.",
    category: "misc",
    subgroup: "String Utilities",
    tier: ToolTier.CLIENT,
    keywords: [
      "repeat",
      "string",
      "character",
      "duplicate",
      "multiply",
      "divider",
      "separator",
      "pattern",
    ],
    examples: [
      {
        title: "Create a 40-character divider line",
        description:
          "Repeat a dash character 40 times to create a horizontal rule for text files",
        input: "-",
        options: { count: 40, separator: "" },
        output: "----------------------------------------",
      },
      {
        title: "Repeat a pattern with custom separator",
        description:
          "Repeat the word 'NA' 5 times separated by spaces, useful for placeholder text",
        input: "NA",
        options: { count: 5, separator: " " },
        output: "NA NA NA NA NA",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
