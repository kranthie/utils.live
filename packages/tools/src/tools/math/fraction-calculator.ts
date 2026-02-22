import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Two fractions with operator (e.g., '1/2 + 3/4')"),
});

const outputSchema = z.object({
  output: z.string().describe("Result as simplified fraction"),
});

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function parseFraction(s: string): [number, number] {
  s = s.trim();
  if (s.includes("/")) {
    const parts = s.split("/").map((p) => parseInt(p.trim(), 10));
    const num = parts[0];
    const den = parts[1];
    if (
      num === undefined ||
      den === undefined ||
      isNaN(num) ||
      isNaN(den) ||
      den === 0
    )
      throw new Error(`Invalid fraction: ${s}`);
    return [num, den];
  }
  const n = parseInt(s, 10);
  if (isNaN(n)) throw new Error(`Invalid number: ${s}`);
  return [n, 1];
}

function simplify(num: number, den: number): [number, number] {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(Math.abs(num), den);
  return [num / g, den / g];
}

export const fractionCalculator = defineTool({
  meta: {
    id: "math/fraction-calculator",
    name: "Fraction Calculator",
    description:
      "Free online Fraction Calculator — perform fraction arithmetic instantly in your browser. No data is stored. Add, subtract, multiply, and divide fractions with automatic simplification and decimal conversion.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: ["fraction", "math", "add", "subtract", "multiply", "divide"],
    examples: [
      {
        title: "Add Fractions",
        description: "Add 1/3 and 1/4 together",
        input: "1/3 + 1/4",
        output: "7/12 (0.5833333333333334)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const match = input.input.trim().match(/^(.+?)\s+([+\-*x×÷])\s+(.+)$/);
    if (!match || !match[1] || !match[2] || !match[3])
      throw new Error("Format: fraction operator fraction (e.g., '1/2 + 3/4')");
    const [n1, d1] = parseFraction(match[1]);
    let op = match[2];
    const [n2, d2] = parseFraction(match[3]);

    if (op === "x" || op === "×") op = "*";
    if (op === "÷") op = "/";

    let rn: number, rd: number;
    switch (op) {
      case "+":
        rn = n1 * d2 + n2 * d1;
        rd = d1 * d2;
        break;
      case "-":
        rn = n1 * d2 - n2 * d1;
        rd = d1 * d2;
        break;
      case "*":
        rn = n1 * n2;
        rd = d1 * d2;
        break;
      case "/":
        if (n2 === 0) throw new Error("Division by zero");
        rn = n1 * d2;
        rd = d1 * n2;
        break;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }

    const [sn, sd] = simplify(rn, rd);
    const result = sd === 1 ? `${sn}` : `${sn}/${sd}`;
    const decimal = sn / sd;
    return { output: `${result} (${decimal})` };
  },
});
