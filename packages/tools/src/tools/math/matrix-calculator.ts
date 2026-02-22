import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "Matrix or matrices. Format: rows separated by semicolons, values by commas. For two matrices, separate with '|'. E.g., '1,2;3,4 | 5,6;7,8'"
    ),
});

const optionsSchema = z.object({
  operation: z
    .enum(["add", "subtract", "multiply", "transpose", "determinant", "scalar"])
    .default("transpose")
    .describe("Matrix operation"),
  scalar: z
    .number()
    .default(1)
    .describe("Scalar value for scalar multiplication"),
});

const outputSchema = z.object({
  output: z.string().describe("Matrix operation result"),
});

type Matrix = number[][];

function parseMatrix(s: string): Matrix {
  const rows = s
    .trim()
    .split(";")
    .map((r) =>
      r
        .trim()
        .split(/[\s,]+/)
        .map(Number)
    );
  if (rows.some((r) => r.some(isNaN))) throw new Error("Invalid matrix values");
  if (rows.length === 0) throw new Error("Empty matrix");
  const cols = rows[0]!.length;
  if (rows.some((r) => r.length !== cols))
    throw new Error("All rows must have the same number of columns");
  return rows;
}

function formatMatrix(m: Matrix): string {
  return m.map((r) => r.map((v) => v.toString()).join("\t")).join("\n");
}

function transpose(m: Matrix): Matrix {
  const result: Matrix = [];
  const rows = m.length;
  const cols = m[0]!.length;
  for (let j = 0; j < cols; j++) {
    const row: number[] = [];
    for (let i = 0; i < rows; i++) {
      row.push(m[i]![j]!);
    }
    result.push(row);
  }
  return result;
}

function determinant(m: Matrix): number {
  const n = m.length;
  if (m.some((r) => r.length !== n))
    throw new Error("Determinant requires a square matrix");
  if (n === 1) return m[0]![0]!;
  if (n === 2) return m[0]![0]! * m[1]![1]! - m[0]![1]! * m[1]![0]!;
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map((r) => [...r.slice(0, j), ...r.slice(j + 1)]);
    det += (j % 2 === 0 ? 1 : -1) * m[0]![j]! * determinant(minor);
  }
  return det;
}

export const matrixCalculator = defineTool({
  meta: {
    id: "math/matrix-calculator",
    name: "Matrix Calculator",
    description:
      "Free online Matrix Calculator — perform matrix operations instantly in your browser. No data is stored. Supports addition, subtraction, multiplication, transpose, determinant, and scalar multiplication.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "matrix",
      "linear",
      "algebra",
      "transpose",
      "determinant",
      "multiply",
    ],
    examples: [
      {
        title: "Transpose a 2x3 Matrix",
        description: "Transpose a 2x3 matrix (rows become columns)",
        input: "1,2,3;4,5,6",
        output: "1\t4\n2\t5\n3\t6",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const op = options?.operation ?? "transpose";
    const parts = input.input.split("|");

    if (op === "transpose") {
      const m = parseMatrix(parts[0] ?? "");
      return { output: formatMatrix(transpose(m)) };
    }

    if (op === "determinant") {
      const m = parseMatrix(parts[0] ?? "");
      return { output: `${determinant(m)}` };
    }

    if (op === "scalar") {
      const m = parseMatrix(parts[0] ?? "");
      const s = options?.scalar ?? 1;
      return { output: formatMatrix(m.map((r) => r.map((v) => v * s))) };
    }

    if (parts.length < 2)
      throw new Error("Two matrices required (separate with |)");
    const a = parseMatrix(parts[0] ?? "");
    const b = parseMatrix(parts[1] ?? "");

    if (op === "add" || op === "subtract") {
      if (a.length !== b.length || a[0]!.length !== b[0]!.length) {
        throw new Error(
          "Matrices must have the same dimensions for addition/subtraction"
        );
      }
      const result = a.map((r, i) =>
        r.map((v, j) => (op === "add" ? v + b[i]![j]! : v - b[i]![j]!))
      );
      return { output: formatMatrix(result) };
    }

    if (op === "multiply") {
      if (a[0]!.length !== b.length) {
        throw new Error(
          "Number of columns in first matrix must equal number of rows in second"
        );
      }
      const result: Matrix = [];
      for (let i = 0; i < a.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < b[0]!.length; j++) {
          let sum = 0;
          for (let k = 0; k < a[0]!.length; k++) {
            sum += a[i]![k]! * b[k]![j]!;
          }
          row.push(sum);
        }
        result.push(row);
      }
      return { output: formatMatrix(result) };
    }

    throw new Error(`Unknown operation: ${op as string}`);
  },
});
