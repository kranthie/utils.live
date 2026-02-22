import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Math expression to evaluate (e.g., '2 + 3 * 4')"),
});

const outputSchema = z.object({
  output: z.string().describe("Evaluation result"),
});

// Simple recursive descent parser for math expressions
// Supports: +, -, *, /, ^, %, (), unary minus
function evaluate(expr: string): number {
  let pos = 0;
  const str = expr.replace(/\s+/g, "");

  function ch(): string {
    return pos < str.length ? str.charAt(pos) : "";
  }

  function parseExpr(): number {
    let left = parseTerm();
    while (ch() === "+" || ch() === "-") {
      const op = ch();
      pos++;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parsePower();
    while (ch() === "*" || ch() === "/" || ch() === "%") {
      const op = ch();
      pos++;
      const right = parsePower();
      if (op === "*") left *= right;
      else if (op === "/") {
        if (right === 0) throw new Error("Division by zero");
        left /= right;
      } else left %= right;
    }
    return left;
  }

  function parsePower(): number {
    let base = parseUnary();
    if (ch() === "^") {
      pos++;
      const exp = parsePower();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (ch() === "-") {
      pos++;
      return -parseAtom();
    }
    if (ch() === "+") {
      pos++;
    }
    return parseAtom();
  }

  function parseAtom(): number {
    if (ch() === "(") {
      pos++;
      const val = parseExpr();
      if (ch() !== ")") throw new Error("Missing closing parenthesis");
      pos++;
      return val;
    }
    const start = pos;
    while (pos < str.length && ((ch() >= "0" && ch() <= "9") || ch() === ".")) {
      pos++;
    }
    if (pos === start)
      throw new Error(
        `Unexpected character at position ${pos}: '${ch() || "end"}'`
      );
    return parseFloat(str.slice(start, pos));
  }

  const result = parseExpr();
  if (pos < str.length)
    throw new Error(`Unexpected character at position ${pos}: '${ch()}'`);
  return result;
}

export const expressionEvaluator = defineTool({
  meta: {
    id: "math/expression-evaluator",
    name: "Expression Evaluator",
    description:
      "Free online Expression Evaluator — evaluate math expressions instantly in your browser. No data is stored. Supports addition, subtraction, multiplication, division, exponentiation, modulus, and parentheses.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["expression", "evaluate", "calculator", "math", "arithmetic"],
    examples: [
      {
        title: "Arithmetic Expression",
        description: "Evaluate a compound arithmetic expression",
        input: "(2 + 3) * 4 - 6 / 2",
        output: "17",
      },
      {
        title: "Exponentiation",
        description: "Evaluate an expression with powers",
        input: "2 ^ 10",
        output: "1024",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const expr = input.input.trim();
    if (!expr) throw new Error("Expression cannot be empty");
    const result = evaluate(expr);
    return { output: `${result}` };
  },
});
