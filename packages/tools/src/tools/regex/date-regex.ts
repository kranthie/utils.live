import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  format: z
    .enum(["iso", "us", "eu", "uk", "any", "datetime-iso"])
    .default("iso")
    .describe("Date format"),
});

const outputSchema = z.object({
  output: z.string().describe("Date regex pattern and description"),
  pattern: z.string().describe("The regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const PATTERNS: Record<
  string,
  { pattern: string; desc: string; examples: string[] }
> = {
  iso: {
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    desc: "ISO 8601 date format (YYYY-MM-DD)",
    examples: ["2024-01-15", "2023-12-31"],
  },
  us: {
    pattern: "^(?:0[1-9]|1[0-2])\\/(?:0[1-9]|[12]\\d|3[01])\\/\\d{4}$",
    desc: "US date format (MM/DD/YYYY)",
    examples: ["01/15/2024", "12/31/2023"],
  },
  eu: {
    pattern: "^(?:0[1-9]|[12]\\d|3[01])\\.(?:0[1-9]|1[0-2])\\.\\d{4}$",
    desc: "European date format (DD.MM.YYYY)",
    examples: ["15.01.2024", "31.12.2023"],
  },
  uk: {
    pattern: "^(?:0[1-9]|[12]\\d|3[01])\\/(?:0[1-9]|1[0-2])\\/\\d{4}$",
    desc: "UK date format (DD/MM/YYYY)",
    examples: ["15/01/2024", "31/12/2023"],
  },
  any: {
    pattern:
      "(?:\\d{4}[\\-/.]\\d{1,2}[\\-/.]\\d{1,2})|(?:\\d{1,2}[\\-/.]\\d{1,2}[\\-/.]\\d{4})",
    desc: "Flexible date pattern (various separators and orders)",
    examples: ["2024-01-15", "01/15/2024", "15.01.2024"],
  },
  "datetime-iso": {
    pattern:
      "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])T(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?$",
    desc: "ISO 8601 datetime with optional timezone",
    examples: ["2024-01-15T14:30:00Z", "2024-01-15T14:30:00+05:30"],
  },
};

function execute(input: Input): Output {
  const p = PATTERNS[input.format]!;
  const lines: string[] = [];
  lines.push(`Date Regex (${input.format}):`);
  lines.push("");
  lines.push(p.pattern);
  lines.push("");
  lines.push(p.desc);
  lines.push("");
  lines.push("Examples:");
  p.examples.forEach((e) => lines.push(`  ${e}`));

  return { output: lines.join("\n"), pattern: p.pattern };
}

export const dateRegex = defineTool({
  meta: {
    id: "regex/date-regex",
    name: "Date Regex",
    description:
      "Free online date regex generator — create date validation patterns for ISO 8601, US, EU, UK, and datetime formats instantly in your browser. No data is stored. Includes matching examples for each format.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "date",
      "format",
      "validate",
      "iso",
      "pattern",
      "yyyy-mm-dd",
      "mm/dd/yyyy",
      "dd/mm/yyyy",
      "timestamp",
    ],
    examples: [
      {
        title: "ISO 8601 date format validation (YYYY-MM-DD)",
        description:
          "Get the regex pattern for ISO 8601 date format (YYYY-MM-DD)",
        input: "iso",
        output:
          "Date Regex (iso):\n\n^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$\n\nISO 8601 date format (YYYY-MM-DD)\n\nExamples:\n  2024-01-15\n  2023-12-31",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
