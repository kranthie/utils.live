import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const inputSchema = z.object({
  input: z.string().describe("Number to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted number in target base"),
});

const optionsSchema = z.object({
  fromBase: z
    .number()
    .min(2)
    .max(36)
    .default(10)
    .describe("Source base (2-36)"),
  toBase: z.number().min(2).max(36).default(16).describe("Target base (2-36)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const fromBase = options?.fromBase ?? 10;
  const toBase = options?.toBase ?? 16;

  try {
    let str = input.input.trim().toUpperCase();
    if (!str) {
      throw new Error("Input cannot be empty");
    }

    let negative = false;
    if (str.startsWith("-")) {
      negative = true;
      str = str.substring(1);
    }

    // Remove common prefixes
    str = str.replace(/^0[XBOB]/i, "");

    // Validate digits for fromBase
    for (const ch of str) {
      const digitVal = DIGITS.indexOf(ch);
      if (digitVal === -1 || digitVal >= fromBase) {
        throw new Error(`Invalid digit '${ch}' for base ${fromBase}`);
      }
    }

    // Convert to BigInt via base conversion
    let value = BigInt(0);
    const bigBase = BigInt(fromBase);
    for (const ch of str) {
      const digitVal = BigInt(DIGITS.indexOf(ch));
      value = value * bigBase + digitVal;
    }

    // Convert from BigInt to target base
    if (value === BigInt(0)) {
      return { output: "0" };
    }

    let result = "";
    const bigToBase = BigInt(toBase);
    let remaining = value;
    while (remaining > BigInt(0)) {
      const remainder = Number(remaining % bigToBase);
      result = DIGITS[remainder] + result;
      remaining = remaining / bigToBase;
    }

    if (negative) {
      result = "-" + result;
    }

    return { output: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Conversion failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Base conversion failed: ${msg}`,
    });
  }
}

export const anyBaseConverter = defineTool({
  meta: {
    id: "encoding/any-base-converter",
    name: "Any Base Converter",
    description:
      "Free online any-base number converter — convert numbers between any bases (2-36) instantly in your browser. No data is stored. Supports decimal, hex, binary, octal, and arbitrary radix up to base 36.",
    category: "encoding",
    subgroup: "Number Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["base", "convert", "radix", "number", "binary", "hex", "octal"],
    examples: [
      {
        title: "Decimal to Hex",
        description: "Convert the decimal number 255 to hexadecimal",
        input: "255",
        output: "FF",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
