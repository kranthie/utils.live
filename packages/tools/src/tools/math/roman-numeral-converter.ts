import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Decimal number or Roman numeral to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["auto", "to-roman", "from-roman"])
    .default("auto")
    .describe("Conversion mode: auto-detect, to Roman, or from Roman"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const ROMAN_VALUES: [string, number][] = [
  ["M", 1000],
  ["CM", 900],
  ["D", 500],
  ["CD", 400],
  ["C", 100],
  ["XC", 90],
  ["L", 50],
  ["XL", 40],
  ["X", 10],
  ["IX", 9],
  ["V", 5],
  ["IV", 4],
  ["I", 1],
];

const ROMAN_CHAR_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

export function toRoman(num: number): string {
  if (num <= 0 || num > 3999) {
    throw new Error(
      "Number must be between 1 and 3999 for Roman numeral conversion"
    );
  }
  if (!Number.isInteger(num)) {
    throw new Error("Number must be an integer");
  }

  let result = "";
  let remaining = num;

  for (const [roman, value] of ROMAN_VALUES) {
    while (remaining >= value) {
      result += roman;
      remaining -= value;
    }
  }

  return result;
}

export function fromRoman(str: string): number {
  const upper = str.toUpperCase().trim();
  if (!upper) {
    throw new Error("Input cannot be empty");
  }

  if (!/^[IVXLCDM]+$/.test(upper)) {
    throw new Error("Invalid Roman numeral characters");
  }

  let result = 0;
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i]!;
    const current = ROMAN_CHAR_VALUES[ch] ?? 0;
    const nextCh = upper[i + 1];
    const next = nextCh ? (ROMAN_CHAR_VALUES[nextCh] ?? 0) : 0;

    if (current < next) {
      result -= current;
    } else {
      result += current;
    }
  }

  // Validate by converting back
  if (result > 0 && result <= 3999) {
    const roundTrip = toRoman(result);
    if (roundTrip !== upper) {
      throw new Error(
        `Invalid Roman numeral: '${str}' (did you mean ${roundTrip} = ${result}?)`
      );
    }
  }

  return result;
}

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "auto";

  try {
    const trimmed = input.input.trim();
    if (!trimmed) {
      throw new Error("Input cannot be empty");
    }

    let actualMode = mode;
    if (actualMode === "auto") {
      // Auto-detect: if it looks like a number, convert to Roman; otherwise from Roman
      if (/^\d+$/.test(trimmed)) {
        actualMode = "to-roman";
      } else {
        actualMode = "from-roman";
      }
    }

    if (actualMode === "to-roman") {
      const num = parseInt(trimmed, 10);
      if (isNaN(num)) {
        throw new Error("Invalid number");
      }
      return { output: toRoman(num) };
    } else {
      const num = fromRoman(trimmed);
      return { output: num.toString() };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Conversion failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Roman numeral conversion failed: ${msg}`,
    });
  }
}

export const romanNumeralConverter = defineTool({
  meta: {
    id: "math/roman-numeral-converter",
    name: "Roman Numeral Converter",
    description:
      "Free online Roman Numeral Converter — convert between decimal numbers and Roman numerals instantly in your browser. No data is stored. Supports numbers 1-3999 with auto-detection and round-trip validation.",
    category: "math",
    subgroup: "Number Formats",
    tier: ToolTier.CLIENT,
    keywords: ["roman", "numeral", "convert", "number", "I", "V", "X"],
    examples: [
      {
        title: "Number to Roman",
        description: "Convert 2024 to Roman numerals",
        input: "2024",
        output: "MMXXIV",
      },
      {
        title: "Roman to Number",
        description: "Convert XLII to a decimal number",
        input: "XLII",
        output: "42",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
