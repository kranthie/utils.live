import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract groups from"),
});

const optionsSchema = z.object({
  pattern: z
    .string()
    .default("(\\w+)")
    .describe("Regex pattern with capture groups"),
  flags: z.string().default("g").describe("Regex flags"),
});

const outputSchema = z.object({
  output: z.string().describe("Extracted groups formatted as text"),
  groups: z
    .array(z.record(z.string(), z.string()))
    .describe("Array of group objects per match"),
  matchCount: z.number().describe("Number of matches"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? "(\\w+)";
  const flags = options?.flags ?? "g";

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  const allGroups: Array<Record<string, string>> = [];
  const lines: string[] = [];
  lines.push(`Pattern: /${pattern}/${flags}`);
  lines.push("");

  if (flags.includes("g")) {
    let m: RegExpExecArray | null;
    let matchIdx = 0;
    while ((m = regex.exec(input.input)) !== null) {
      matchIdx++;
      const groupObj: Record<string, string> = { "0": m[0] };
      lines.push(`Match ${matchIdx}: "${m[0]}"`);

      // Numbered groups
      for (let g = 1; g < m.length; g++) {
        groupObj[String(g)] = m[g] ?? "";
        lines.push(`  Group ${g}: "${m[g] ?? ""}"`);
      }

      // Named groups
      if (m.groups) {
        for (const [name, value] of Object.entries(m.groups)) {
          groupObj[name] = value ?? "";
          lines.push(`  Group '${name}': "${value ?? ""}"`);
        }
      }

      allGroups.push(groupObj);
      if (m[0].length === 0) regex.lastIndex++;
    }
  } else {
    const m = regex.exec(input.input);
    if (m) {
      const groupObj: Record<string, string> = { "0": m[0] };
      lines.push(`Match: "${m[0]}"`);

      for (let g = 1; g < m.length; g++) {
        groupObj[String(g)] = m[g] ?? "";
        lines.push(`  Group ${g}: "${m[g] ?? ""}"`);
      }

      if (m.groups) {
        for (const [name, value] of Object.entries(m.groups)) {
          groupObj[name] = value ?? "";
          lines.push(`  Group '${name}': "${value ?? ""}"`);
        }
      }

      allGroups.push(groupObj);
    }
  }

  if (allGroups.length === 0) {
    lines.push("No matches found.");
  }

  return {
    output: lines.join("\n"),
    groups: allGroups,
    matchCount: allGroups.length,
  };
}

export const regexGroups = defineTool({
  meta: {
    id: "regex/regex-groups",
    name: "Regex Groups",
    description:
      "Free online regex group extractor — extract named and numbered capture groups from regex matches instantly in your browser. No data is stored. Shows all groups for each match with clear formatting.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "groups",
      "capture",
      "named",
      "extract",
      "backreference",
      "subpattern",
    ],
    examples: [
      {
        title: "Extract year, month, day from ISO dates",
        description:
          "Use capture groups to extract year, month, and day from a date string",
        input: "Today is 2024-01-15 and tomorrow is 2024-01-16",
        options: { pattern: "(\\d{4})-(\\d{2})-(\\d{2})", flags: "g" },
        output:
          'Pattern: /(\\d{4})-(\\d{2})-(\\d{2})/g\n\nMatch 1: "2024-01-15"\n  Group 1: "2024"\n  Group 2: "01"\n  Group 3: "15"\nMatch 2: "2024-01-16"\n  Group 1: "2024"\n  Group 2: "01"\n  Group 3: "16"',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
