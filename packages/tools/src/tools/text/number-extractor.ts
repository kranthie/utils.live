import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract numbers from"),
});

const outputSchema = z.object({
  numbers: z.array(z.number()).describe("Extracted numbers"),
  integers: z.array(z.number()).describe("Integer values"),
  floats: z.array(z.number()).describe("Decimal values"),
  count: z.number().describe("Number count"),
  sum: z.number().describe("Sum of all numbers"),
  average: z.number().describe("Average of numbers"),
  min: z.number().optional().describe("Minimum value"),
  max: z.number().optional().describe("Maximum value"),
});

const optionsSchema = z.object({
  includeNegative: z
    .boolean()
    .default(true)
    .describe("Include negative numbers"),
  includeDecimals: z
    .boolean()
    .default(true)
    .describe("Include decimal numbers"),
  includePercentages: z
    .boolean()
    .default(false)
    .describe("Convert percentages to decimals"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Extracts numbers from text.
 */
function execute(input: Input, options?: Options): Output {
  const includeNegative = options?.includeNegative ?? true;
  const includeDecimals = options?.includeDecimals ?? true;
  const includePercentages = options?.includePercentages ?? false;

  const text = input.input;
  const numbers: number[] = [];
  const integers: number[] = [];
  const floats: number[] = [];

  // Build regex based on options
  let pattern: string;
  if (includeNegative && includeDecimals) {
    pattern = "-?\\d+(?:\\.\\d+)?";
  } else if (includeNegative) {
    pattern = "-?\\d+";
  } else if (includeDecimals) {
    pattern = "\\d+(?:\\.\\d+)?";
  } else {
    pattern = "\\d+";
  }

  const regex = new RegExp(pattern, "g");
  const matches = text.match(regex) || [];

  for (const match of matches) {
    const num = parseFloat(match);
    if (!isNaN(num)) {
      numbers.push(num);
      if (Number.isInteger(num)) {
        integers.push(num);
      } else {
        floats.push(num);
      }
    }
  }

  // Handle percentages
  if (includePercentages) {
    const percentRegex = /(\d+(?:\.\d+)?)\s*%/g;
    let percentMatch: RegExpExecArray | null;
    while ((percentMatch = percentRegex.exec(text)) !== null) {
      const matched = percentMatch[1];
      if (matched) {
        const num = parseFloat(matched) / 100;
        if (!isNaN(num) && !numbers.includes(parseFloat(matched))) {
          numbers.push(num);
          floats.push(num);
        }
      }
    }
  }

  const count = numbers.length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const average = count > 0 ? sum / count : 0;

  return {
    numbers,
    integers,
    floats,
    count,
    sum: Math.round(sum * 1000) / 1000,
    average: Math.round(average * 1000) / 1000,
    min: count > 0 ? Math.min(...numbers) : undefined,
    max: count > 0 ? Math.max(...numbers) : undefined,
  };
}

/**
 * Number Extractor tool.
 * Extracts all numbers from text.
 */
export const numberExtractor = defineTool({
  meta: {
    id: "text/number-extractor",
    name: "Number Extractor",
    description:
      "Free online number extractor — find and extract all numeric values from text instantly in your browser. No data is stored. Supports integers, decimals, negatives, and percentages with sum, average, min, and max.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["number", "extract", "digit", "integer", "decimal"],
    examples: [
      {
        title: "Extract numbers from text",
        description: "Pull out all numeric values from a sentence",
        input: "The server has 16 cores, 64GB RAM, and costs $12.50/hour.",
        output:
          '{"numbers":[16,64,12.5],"integers":[16,64],"floats":[12.5],"count":3,"sum":92.5,"average":30.833,"min":12.5,"max":64}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
