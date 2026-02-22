import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  format: z
    .enum(["us", "uk", "international", "e164", "flexible"])
    .default("us")
    .describe("Phone number format"),
});

const outputSchema = z.object({
  output: z.string().describe("Phone regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<
  string,
  { pattern: string; desc: string; examples: string[] }
> = {
  us: {
    pattern: "^\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$",
    desc: "US phone number (with optional country code, area code)",
    examples: ["(555) 123-4567", "+1-555-123-4567", "5551234567"],
  },
  uk: {
    pattern: "^(?:\\+44|0)\\d{10}$",
    desc: "UK phone number",
    examples: ["+441234567890", "01234567890"],
  },
  international: {
    pattern:
      "^\\+?\\d{1,4}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}$",
    desc: "International phone number (flexible format)",
    examples: ["+44 20 7946 0958", "+1 (555) 123-4567"],
  },
  e164: {
    pattern: "^\\+[1-9]\\d{1,14}$",
    desc: "E.164 international phone format (strict)",
    examples: ["+14155552671", "+442071234567"],
  },
  flexible: {
    pattern: "^[\\d\\s.()+-]{7,20}$",
    desc: "Flexible phone pattern (accepts most common formats)",
    examples: ["555-1234", "(555) 123-4567", "+1.555.123.4567"],
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.format]!;
  const lines: string[] = [];
  lines.push(`Phone Regex (${input.format}):`);
  lines.push("");
  lines.push(p.pattern);
  lines.push("");
  lines.push(p.desc);
  lines.push("");
  lines.push("Examples:");
  p.examples.forEach((e) => lines.push(`  ${e}`));

  return { output: lines.join("\n"), pattern: p.pattern };
}

export const phoneRegex = defineTool({
  meta: {
    id: "regex/phone-regex",
    name: "Phone Regex",
    description:
      "Free online phone number regex generator — create validation patterns for US, UK, international, and E.164 formats instantly in your browser. No data is stored. Includes matching examples for each format.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "phone",
      "telephone",
      "validate",
      "pattern",
      "mobile",
      "e164",
      "country-code",
    ],
    examples: [
      {
        title: "US phone number validation with area code",
        description: "Get the regex pattern for US phone number validation",
        input: "us",
        output:
          "Phone Regex (us):\n\n^\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$\n\nUS phone number (with optional country code, area code)\n\nExamples:\n  (555) 123-4567\n  +1-555-123-4567\n  5551234567",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
