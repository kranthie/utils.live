import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Number to check for primality"),
});

const outputSchema = z.object({
  output: z.string().describe("Primality result"),
});

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export const primeChecker = defineTool({
  meta: {
    id: "math/prime-checker",
    name: "Prime Checker",
    description:
      "Free online Prime Checker — check if a number is prime instantly in your browser. No data is stored. Fast primality testing for any integer up to the maximum safe integer.",
    category: "math",
    subgroup: "Math Operations",
    tier: ToolTier.CLIENT,
    keywords: ["prime", "number", "check", "primality", "test"],
    examples: [
      {
        title: "Check Prime",
        description: "Check if 97 is a prime number",
        input: "97",
        output: "97 is a prime number",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const n = parseInt(input.input.trim(), 10);
    if (isNaN(n)) throw new Error("Invalid integer");
    if (n > Number.MAX_SAFE_INTEGER) throw new Error("Number too large");
    const result = isPrime(n);
    return { output: `${n} is ${result ? "" : "not "}a prime number` };
  },
});
