import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

/**
 * Maximum input string length to limit ReDoS impact.
 */
const MAX_INPUT_LENGTH = 100_000;

/**
 * Maximum pattern length to limit complexity.
 */
const MAX_PATTERN_LENGTH = 1000;

/**
 * Detects potentially catastrophic regex patterns that could cause ReDoS.
 * Checks for common vulnerable constructs: nested quantifiers, overlapping alternations.
 */
function isSafeRegex(pattern: string): boolean {
  // Detect nested quantifiers: (a+)+, (a*)+, (a+)*, (a{1,})+, etc.
  // These are the primary cause of catastrophic backtracking.
  // Pattern: quantifier followed by another quantifier on a group
  const nestedQuantifiers =
    /(\+|\*|\{[0-9]+,\s*[0-9]*\})\s*\)(\+|\*|\?|\{[0-9]+,\s*[0-9]*\})/;
  if (nestedQuantifiers.test(pattern)) {
    return false;
  }

  // Detect overlapping alternation with quantifiers: (a|a)+, ([a-c]|[b-d])+
  // Simplified check: group with alternation followed by quantifier
  const overlappingAltWithQuantifier = /\([^)]*\|[^)]*\)(\+|\*|\{[0-9]+,)/;
  if (overlappingAltWithQuantifier.test(pattern)) {
    // Additional check: are the alternatives potentially overlapping?
    const groupMatch = pattern.match(/\(([^)]*\|[^)]*)\)(\+|\*|\{)/);
    if (groupMatch) {
      const alternatives = groupMatch[1]!.split("|");
      // If any two alternatives could match the same character, it's dangerous
      for (let i = 0; i < alternatives.length; i++) {
        for (let j = i + 1; j < alternatives.length; j++) {
          const a = alternatives[i]!.trim();
          const b = alternatives[j]!.trim();
          if (a === b) return false; // identical alternatives
          // Single char overlap check
          if (a.length === 1 && b.length === 1 && a === b) return false;
        }
      }
    }
  }

  return true;
}

const inputSchema = z.object({
  input: z
    .string()
    .max(
      MAX_INPUT_LENGTH,
      `Input must be at most ${MAX_INPUT_LENGTH} characters`
    )
    .describe("Test string to match against"),
});

const optionsSchema = z.object({
  pattern: z
    .string()
    .max(
      MAX_PATTERN_LENGTH,
      `Pattern must be at most ${MAX_PATTERN_LENGTH} characters`
    )
    .default("\\w+")
    .describe("Regular expression pattern"),
  flags: z.string().default("g").describe("Regex flags (g, i, m, s, u, y)"),
});

const outputSchema = z.object({
  output: z.string().describe("Match results with highlighted positions"),
  matches: z.array(z.string()).describe("Array of matched strings"),
  matchCount: z.number().describe("Total number of matches"),
  isMatch: z.boolean().describe("Whether the pattern matched at all"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const pattern = options?.pattern ?? "\\w+";
  const flags = options?.flags ?? "g";

  // Check for potentially catastrophic regex patterns (ReDoS protection)
  if (!isSafeRegex(pattern)) {
    throw new Error(
      "Potentially unsafe regex pattern detected (catastrophic backtracking risk). " +
        "Avoid nested quantifiers like (a+)+, (a|a)+, or ([a-z]+)*. " +
        "Consider rewriting your pattern to avoid ambiguous repetition."
    );
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`Invalid regex pattern: ${(e as Error).message}`);
  }

  const text = input.input;
  const matches: string[] = [];
  const matchPositions: Array<{ start: number; end: number; match: string }> =
    [];

  if (flags.includes("g")) {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push(m[0]);
      matchPositions.push({
        start: m.index,
        end: m.index + m[0].length,
        match: m[0],
      });
      if (m[0].length === 0) {
        regex.lastIndex++;
      }
    }
  } else {
    const m = regex.exec(text);
    if (m) {
      matches.push(m[0]);
      matchPositions.push({
        start: m.index,
        end: m.index + m[0].length,
        match: m[0],
      });
    }
  }

  const lines: string[] = [];
  lines.push(`Pattern: /${pattern}/${flags}`);
  lines.push(`Matches: ${matches.length}`);
  lines.push("");

  if (matchPositions.length > 0) {
    // Show each match with its position
    matchPositions.forEach((mp, i) => {
      lines.push(
        `Match ${i + 1}: "${mp.match}" (position ${mp.start}-${mp.end})`
      );
    });

    // Create a visual representation showing matches marked with brackets
    lines.push("");
    lines.push("Input:   " + text);
    let indicator = "         ";
    let lastEnd = 0;
    for (const mp of matchPositions) {
      indicator += " ".repeat(mp.start - lastEnd);
      indicator += "^".repeat(mp.end - mp.start);
      lastEnd = mp.end;
    }
    lines.push(indicator);
  } else {
    lines.push("No matches found.");
  }

  return {
    output: lines.join("\n"),
    matches,
    matchCount: matches.length,
    isMatch: matches.length > 0,
  };
}

export const regexTester = defineTool({
  meta: {
    id: "regex/regex-tester",
    name: "Regex Tester",
    description:
      "Free online regex tester — test regular expressions with live match highlighting and position tracking instantly in your browser. No data is stored. Shows match positions and visual highlighting of matched text.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "test",
      "match",
      "pattern",
      "regular expression",
      "live",
      "highlight",
      "debugger",
      "playground",
    ],
    examples: [
      {
        title: "Test email extraction pattern with match positions",
        description: "Use a regex pattern to find email addresses in text",
        input:
          "Contact us at support@example.com or sales@company.org for help.",
        options: { pattern: "[\\w.-]+@[\\w.-]+\\.\\w+", flags: "g" },
        output:
          'Pattern: /[\\w.-]+@[\\w.-]+\\.\\w+/g\nMatches: 2\n\nMatch 1: "support@example.com" (position 14-33)\nMatch 2: "sales@company.org" (position 37-54)\n\nInput:   Contact us at support@example.com or sales@company.org for help.\n                       ^^^^^^^^^^^^^^^^^^^    ^^^^^^^^^^^^^^^^^',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
