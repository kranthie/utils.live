import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Value or expression"),
});

const optionsSchema = z.object({
  operation: z
    .enum([
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "sinh",
      "cosh",
      "tanh",
      "log",
      "log2",
      "log10",
      "ln",
      "sqrt",
      "cbrt",
      "abs",
      "ceil",
      "floor",
      "round",
      "exp",
      "pow2",
      "pow10",
      "factorial",
      "reciprocal",
    ])
    .default("sqrt")
    .describe("Mathematical operation"),
  angleUnit: z
    .enum(["rad", "deg"])
    .default("rad")
    .describe("Angle unit for trig functions"),
});

const outputSchema = z.object({
  output: z.string().describe("Calculation result"),
});

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n))
    throw new Error("Factorial requires a non-negative integer");
  if (n > 170) throw new Error("Factorial too large (max 170)");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export const scientificCalculator = defineTool({
  meta: {
    id: "math/scientific-calculator",
    name: "Scientific Calculator",
    description:
      "Free online Scientific Calculator — perform advanced math operations instantly in your browser. No data is stored. Supports trigonometric, logarithmic, exponential, and other scientific functions in radians or degrees.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["scientific", "calculator", "sin", "cos", "log", "sqrt", "trig"],
    examples: [
      {
        title: "Square Root",
        description: "Calculate the square root of 144",
        input: "144",
        output: "sqrt(144) = 12",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const op = options?.operation ?? "sqrt";
    const unit = options?.angleUnit ?? "rad";

    const toRad = (v: number): number =>
      unit === "deg" ? (v * Math.PI) / 180 : v;
    const fromRad = (v: number): number =>
      unit === "deg" ? (v * 180) / Math.PI : v;

    let result: number;
    switch (op) {
      case "sin":
        result = Math.sin(toRad(value));
        break;
      case "cos":
        result = Math.cos(toRad(value));
        break;
      case "tan":
        result = Math.tan(toRad(value));
        break;
      case "asin":
        result = fromRad(Math.asin(value));
        break;
      case "acos":
        result = fromRad(Math.acos(value));
        break;
      case "atan":
        result = fromRad(Math.atan(value));
        break;
      case "sinh":
        result = Math.sinh(value);
        break;
      case "cosh":
        result = Math.cosh(value);
        break;
      case "tanh":
        result = Math.tanh(value);
        break;
      case "log":
      case "log10":
        result = Math.log10(value);
        break;
      case "log2":
        result = Math.log2(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "cbrt":
        result = Math.cbrt(value);
        break;
      case "abs":
        result = Math.abs(value);
        break;
      case "ceil":
        result = Math.ceil(value);
        break;
      case "floor":
        result = Math.floor(value);
        break;
      case "round":
        result = Math.round(value);
        break;
      case "exp":
        result = Math.exp(value);
        break;
      case "pow2":
        result = Math.pow(2, value);
        break;
      case "pow10":
        result = Math.pow(10, value);
        break;
      case "factorial":
        result = factorial(value);
        break;
      case "reciprocal":
        if (value === 0) throw new Error("Cannot take reciprocal of zero");
        result = 1 / value;
        break;
      default:
        throw new Error(`Unknown operation: ${op as string}`);
    }
    return { output: `${op}(${value}) = ${result}` };
  },
});
