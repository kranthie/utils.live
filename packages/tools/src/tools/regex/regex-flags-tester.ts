import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Test string to match against"),
});

const optionsSchema = z.object({
  pattern: z.string().default("hello").describe("Regex pattern"),
});

const outputSchema = z.object({
  output: z.string().describe("Comparison of different flag combinations"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function countMatches(text: string, regex: RegExp): number {
  if (!regex.global) {
    return regex.test(text) ? 1 : 0;
  }
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    count++;
    if (m[0].length === 0) regex.lastIndex++;
  }
  return count;
}

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? "hello";

  try {
    new RegExp(pattern);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  const flagSets = [
    { flags: "", label: "(no flags)" },
    { flags: "g", label: "g - global" },
    { flags: "i", label: "i - case insensitive" },
    { flags: "m", label: "m - multiline" },
    { flags: "s", label: "s - dotAll" },
    { flags: "gi", label: "gi - global + case insensitive" },
    { flags: "gm", label: "gm - global + multiline" },
    { flags: "gim", label: "gim - global + case insensitive + multiline" },
    { flags: "gims", label: "gims - all common flags" },
  ];

  const lines: string[] = [];
  lines.push(`Pattern: /${pattern}/`);
  lines.push(
    `Test string: "${input.input.length > 80 ? input.input.substring(0, 80) + "..." : input.input}"`
  );
  lines.push("");
  lines.push("Flag".padEnd(10) + "Description".padEnd(45) + "Matches");
  lines.push("-".repeat(65));

  for (const fs of flagSets) {
    try {
      const regex = new RegExp(pattern, fs.flags);
      const matches = countMatches(input.input, regex);
      lines.push(
        (fs.flags || "(none)").padEnd(10) +
          fs.label.padEnd(45) +
          String(matches)
      );
    } catch {
      lines.push(
        (fs.flags || "(none)").padEnd(10) + fs.label.padEnd(45) + "(error)"
      );
    }
  }

  lines.push("");
  lines.push("Flag Reference:");
  lines.push("  g - Global: find all matches, not just the first");
  lines.push("  i - Case Insensitive: ignore case when matching");
  lines.push("  m - Multiline: ^ and $ match line boundaries");
  lines.push("  s - DotAll: . matches newline characters too");
  lines.push("  u - Unicode: treat pattern as Unicode code points");
  lines.push("  y - Sticky: match from lastIndex position only");

  return { output: lines.join("\n") };
}

export const regexFlagsTester = defineTool({
  meta: {
    id: "regex/regex-flags-tester",
    name: "Regex Flags Tester",
    description:
      "Free online regex flags tester — compare how different regex flags (g, i, m, s, u, y) affect pattern matching instantly in your browser. No data is stored. Shows match counts side-by-side for each flag combination.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "flags",
      "test",
      "global",
      "case",
      "multiline",
      "case-insensitive",
      "dotall",
      "unicode",
      "sticky",
    ],
    examples: [
      {
        title: "Compare case-sensitive vs case-insensitive matching",
        description:
          "Compare how different flags affect matching of mixed-case text",
        input: "Hello hello HELLO world",
        options: { pattern: "hello" },
        output:
          'Pattern: /hello/\nTest string: "Hello hello HELLO world"\n\nFlag      Description                                  Matches\n-----------------------------------------------------------------\n(none)    (no flags)                                   1\ng         g - global                                   1\ni         i - case insensitive                         1\nm         m - multiline                                1\ns         s - dotAll                                   1\ngi        gi - global + case insensitive               3\ngm        gm - global + multiline                      1\ngim       gim - global + case insensitive + multiline  3\ngims      gims - all common flags                      3\n\nFlag Reference:\n  g - Global: find all matches, not just the first\n  i - Case Insensitive: ignore case when matching\n  m - Multiline: ^ and $ match line boundaries\n  s - DotAll: . matches newline characters too\n  u - Unicode: treat pattern as Unicode code points\n  y - Sticky: match from lastIndex position only',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
