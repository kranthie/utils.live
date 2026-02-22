import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("One or two numbers (e.g., '12, 10' or '255')"),
});

const optionsSchema = z.object({
  operation: z
    .enum(["AND", "OR", "XOR", "NOT", "LSHIFT", "RSHIFT"])
    .default("AND")
    .describe("Bitwise operation"),
  shiftAmount: z
    .number()
    .min(0)
    .max(31)
    .default(1)
    .describe("Shift amount (for LSHIFT/RSHIFT)"),
});

const outputSchema = z.object({
  output: z.string().describe("Bitwise operation result"),
});

export const bitwiseCalculator = defineTool({
  meta: {
    id: "math/bitwise-calculator",
    name: "Bitwise Calculator",
    description:
      "Free online Bitwise Calculator — perform bitwise operations instantly in your browser. No data is stored. Supports AND, OR, XOR, NOT, left shift, and right shift with decimal, binary, hex, and octal output.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["bitwise", "AND", "OR", "XOR", "NOT", "shift", "binary"],
    examples: [
      {
        title: "Bitwise AND",
        description: "Perform a bitwise AND on two values (masking)",
        input: "255, 15",
        output:
          "255 AND 15 = 15\nDecimal: 15\nBinary: 1111\nHex: 0xF\nOctal: 0o17",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const op = options?.operation ?? "AND";
    const parts = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((n) => parseInt(n.trim(), 10));
    if (parts.some(isNaN)) throw new Error("Invalid integer(s)");

    let result: number;
    let desc: string;

    if (op === "NOT") {
      if (parts.length < 1 || parts[0] === undefined)
        throw new Error("Provide at least one number");
      const a = parts[0];
      result = ~a;
      desc = `NOT ${a}`;
    } else if (op === "LSHIFT" || op === "RSHIFT") {
      if (parts.length < 1 || parts[0] === undefined)
        throw new Error("Provide at least one number");
      const a = parts[0];
      const shift = options?.shiftAmount ?? 1;
      result = op === "LSHIFT" ? a << shift : a >> shift;
      desc = `${a} ${op === "LSHIFT" ? "<<" : ">>"} ${shift}`;
    } else {
      if (parts.length < 2 || parts[0] === undefined || parts[1] === undefined)
        throw new Error("Provide two numbers for binary operations");
      const a = parts[0];
      const b = parts[1];
      switch (op) {
        case "AND":
          result = a & b;
          desc = `${a} AND ${b}`;
          break;
        case "OR":
          result = a | b;
          desc = `${a} OR ${b}`;
          break;
        case "XOR":
          result = a ^ b;
          desc = `${a} XOR ${b}`;
          break;
        default:
          throw new Error(`Unknown operation: ${op as string}`);
      }
    }

    const lines = [
      `${desc} = ${result}`,
      `Decimal: ${result}`,
      `Binary: ${(result >>> 0).toString(2)}`,
      `Hex: 0x${(result >>> 0).toString(16).toUpperCase()}`,
      `Octal: 0o${(result >>> 0).toString(8)}`,
    ];
    return { output: lines.join("\n") };
  },
});
