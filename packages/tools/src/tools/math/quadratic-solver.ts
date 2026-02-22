import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Coefficients a, b, c for ax² + bx + c = 0 (e.g., '1, -5, 6')"),
});

const outputSchema = z.object({
  output: z.string().describe("Solutions to the quadratic equation"),
});

export const quadraticSolver = defineTool({
  meta: {
    id: "math/quadratic-solver",
    name: "Quadratic Solver",
    description:
      "Free online Quadratic Solver — solve quadratic equations (ax² + bx + c = 0) instantly in your browser. No data is stored. Finds real and complex roots, calculates discriminant, and shows the complete solution.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["quadratic", "equation", "solver", "roots", "polynomial"],
    examples: [
      {
        title: "Solve x^2 - 5x + 6 = 0",
        description: "Find the roots of x^2 - 5x + 6 = 0",
        input: "1, -5, 6",
        output:
          "Equation: 1x² + -5x + 6 = 0\nDiscriminant: 1\nTwo real roots:\nx₁ = 3\nx₂ = 2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const parts = input.input
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (
      parts.length < 3 ||
      parts.some(isNaN) ||
      parts[0] === undefined ||
      parts[1] === undefined ||
      parts[2] === undefined
    )
      throw new Error("Provide a, b, c (e.g., '1, -5, 6')");
    const a = parts[0];
    const b = parts[1];
    const c = parts[2];
    if (a === 0)
      throw new Error(
        "Coefficient 'a' cannot be zero (not a quadratic equation)"
      );

    const discriminant = b * b - 4 * a * c;
    const lines = [
      `Equation: ${a}x² + ${b}x + ${c} = 0`,
      `Discriminant: ${discriminant}`,
    ];

    if (discriminant > 0) {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      lines.push(`Two real roots:`, `x₁ = ${x1}`, `x₂ = ${x2}`);
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      lines.push(`One repeated root:`, `x = ${x}`);
    } else {
      const real = -b / (2 * a);
      const imag = Math.sqrt(-discriminant) / (2 * a);
      lines.push(
        `Two complex roots:`,
        `x₁ = ${real} + ${imag}i`,
        `x₂ = ${real} - ${imag}i`
      );
    }
    return { output: lines.join("\n") };
  },
});
