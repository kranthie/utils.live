import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Number in standard or scientific notation"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted number"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["auto", "to-scientific", "to-standard"])
    .default("auto")
    .describe(
      "Conversion mode: auto-detect, to scientific, or to standard notation"
    ),
  precision: z
    .number()
    .min(1)
    .max(20)
    .default(6)
    .describe("Number of significant digits in scientific notation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function toScientific(numStr: string, precision: number): string {
  const num = parseFloat(numStr);
  if (isNaN(num)) {
    throw new Error("Invalid number");
  }
  if (num === 0) return "0e+0";
  if (!isFinite(num)) {
    throw new Error("Number is not finite");
  }
  return num.toExponential(precision - 1);
}

function toStandard(numStr: string): string {
  const num = parseFloat(numStr);
  if (isNaN(num)) {
    throw new Error("Invalid number");
  }
  if (!isFinite(num)) {
    throw new Error("Number is not finite");
  }

  // For very large or very small numbers, use BigInt-style conversion
  const match = numStr.trim().match(/^([+-]?\d*\.?\d+)[eE]([+-]?\d+)$/);
  if (match) {
    const coefficient = match[1]!;
    const exponent = parseInt(match[2]!, 10);

    // Remove sign
    let isNegative = false;
    let coeff: string = coefficient;
    if (coeff.startsWith("-")) {
      isNegative = true;
      coeff = coeff.substring(1);
    } else if (coeff.startsWith("+")) {
      coeff = coeff.substring(1);
    }

    // Split coefficient into integer and fractional parts
    const dotIndex = coeff.indexOf(".");
    let intPart: string;
    let fracPart: string;
    if (dotIndex >= 0) {
      intPart = coeff.substring(0, dotIndex);
      fracPart = coeff.substring(dotIndex + 1);
    } else {
      intPart = coeff;
      fracPart = "";
    }

    // Combine digits
    const allDigits = intPart + fracPart;
    // The decimal point is currently after intPart.length digits
    // Move it by exponent positions
    const newDotPos = intPart.length + exponent;

    let result: string;
    if (newDotPos <= 0) {
      // Need leading zeros: 0.000...digits
      result = "0." + "0".repeat(-newDotPos) + allDigits;
    } else if (newDotPos >= allDigits.length) {
      // Need trailing zeros
      result = allDigits + "0".repeat(newDotPos - allDigits.length);
    } else {
      // Dot is somewhere in the middle
      result =
        allDigits.substring(0, newDotPos) +
        "." +
        allDigits.substring(newDotPos);
    }

    // Clean up trailing zeros in fractional part
    if (result.includes(".")) {
      result = result.replace(/\.?0+$/, "");
    }

    if (isNegative) {
      result = "-" + result;
    }

    return result || "0";
  }

  // Not in scientific notation, just format normally
  return num.toPrecision(20).replace(/\.?0+$/, "");
}

function isScientificNotation(str: string): boolean {
  return /[eE]/.test(str);
}

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "auto";
  const precision = options?.precision ?? 6;

  try {
    const trimmed = input.input.trim();
    if (!trimmed) {
      throw new Error("Input cannot be empty");
    }

    let actualMode = mode;
    if (actualMode === "auto") {
      actualMode = isScientificNotation(trimmed)
        ? "to-standard"
        : "to-scientific";
    }

    if (actualMode === "to-scientific") {
      return { output: toScientific(trimmed, precision) };
    } else {
      return { output: toStandard(trimmed) };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Conversion failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Scientific notation conversion failed: ${msg}`,
    });
  }
}

export const scientificNotation = defineTool({
  meta: {
    id: "math/scientific-notation",
    name: "Scientific Notation",
    description:
      "Free online Scientific Notation Converter — convert between standard and scientific notation instantly in your browser. No data is stored. Auto-detects input format with configurable precision up to 20 significant digits.",
    category: "math",
    subgroup: "Number Formats",
    tier: ToolTier.CLIENT,
    keywords: ["scientific", "notation", "exponent", "number", "convert"],
    examples: [
      {
        title: "To Scientific Notation",
        description: "Convert Avogadro's number to scientific notation",
        input: "602214076000000000000000",
        output: "6.02214e+23",
      },
      {
        title: "From Scientific Notation",
        description: "Convert scientific notation to standard form",
        input: "3.14e4",
        output: "31400",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
