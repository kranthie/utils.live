import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  principal: z.number().min(0).default(100000).describe("Loan amount"),
  annualRate: z
    .number()
    .min(0)
    .max(100)
    .default(5)
    .describe("Annual interest rate (%)"),
  years: z.number().min(1).max(50).default(30).describe("Loan term in years"),
});

const outputSchema = z.object({
  output: z.string().describe("Loan payment breakdown"),
});

export const loanCalculator = defineTool({
  meta: {
    id: "math/loan-calculator",
    name: "Loan Calculator",
    description:
      "Free online Loan Calculator — calculate monthly loan payments instantly in your browser. No data is stored. Enter principal, interest rate, and term to see monthly payment, total payment, and total interest.",
    category: "math",
    subgroup: "Number Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "loan",
      "mortgage",
      "payment",
      "monthly",
      "interest",
      "amortization",
    ],
    examples: [
      {
        title: "30-Year Mortgage",
        description:
          "Calculate monthly payments on a $300,000 mortgage at 6.5%",
        input: { principal: 300000, annualRate: 6.5, years: 30 },
        output:
          "Loan Amount: $300000.00\nAnnual Rate: 6.50%\nTerm: 30 years (360 months)\n\nMonthly Payment: $1896.20\nTotal Payment: $682633.47\nTotal Interest: $382633.47",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const P = input.principal ?? 100000;
    const r = (input.annualRate ?? 5) / 100 / 12;
    const n = (input.years ?? 30) * 12;

    let monthlyPayment: number;
    if (r === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment =
        (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    }
    const totalPayment = monthlyPayment * n;
    const totalInterest = totalPayment - P;

    const lines = [
      `Loan Amount: $${P.toFixed(2)}`,
      `Annual Rate: ${(input.annualRate ?? 5).toFixed(2)}%`,
      `Term: ${input.years ?? 30} years (${n} months)`,
      ``,
      `Monthly Payment: $${monthlyPayment.toFixed(2)}`,
      `Total Payment: $${totalPayment.toFixed(2)}`,
      `Total Interest: $${totalInterest.toFixed(2)}`,
    ];
    return { output: lines.join("\n") };
  },
});
