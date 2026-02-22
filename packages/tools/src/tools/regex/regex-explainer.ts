import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Regular expression pattern to explain"),
});

const outputSchema = z.object({
  output: z.string().describe("Plain English explanation of the regex"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function explainPattern(pattern: string): string {
  const parts: string[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i]!;

    // Escaped characters
    if (ch === "\\") {
      const next = pattern[i + 1];
      const escapeMap: Record<string, string> = {
        d: "any digit (0-9)",
        D: "any non-digit character",
        w: "any word character (letter, digit, or underscore)",
        W: "any non-word character",
        s: "any whitespace character (space, tab, newline)",
        S: "any non-whitespace character",
        b: "a word boundary",
        B: "a non-word boundary",
        t: "a tab character",
        n: "a newline",
        r: "a carriage return",
      };
      if (next && escapeMap[next]) {
        parts.push(escapeMap[next]);
        i += 2;
      } else if (next) {
        parts.push(`the literal character '${next}'`);
        i += 2;
      } else {
        parts.push("a backslash");
        i++;
      }
      continue;
    }

    // Character classes
    if (ch === "[") {
      let end = i + 1;
      if (pattern[end] === "^") end++;
      if (pattern[end] === "]") end++;
      while (end < pattern.length && pattern[end] !== "]") {
        if (pattern[end] === "\\") end++;
        end++;
      }
      const cls = pattern.substring(i, end + 1);
      const negated = pattern[i + 1] === "^";
      const inner = cls.slice(negated ? 2 : 1, -1);
      parts.push(
        negated
          ? `any character NOT in [${inner}]`
          : `any character in [${inner}]`
      );
      i = end + 1;
      continue;
    }

    // Groups
    if (ch === "(") {
      if (pattern.substring(i, i + 3) === "(?:") {
        parts.push("a non-capturing group containing:");
        i += 3;
        continue;
      }
      if (pattern.substring(i, i + 3) === "(?=") {
        parts.push("followed by (lookahead):");
        i += 3;
        continue;
      }
      if (pattern.substring(i, i + 3) === "(?!") {
        parts.push("NOT followed by (negative lookahead):");
        i += 3;
        continue;
      }
      if (pattern.substring(i, i + 4) === "(?<=") {
        parts.push("preceded by (lookbehind):");
        i += 4;
        continue;
      }
      if (pattern.substring(i, i + 4) === "(?<!") {
        parts.push("NOT preceded by (negative lookbehind):");
        i += 4;
        continue;
      }
      if (pattern[i + 1] === "?" && pattern[i + 2] === "<") {
        const nameEnd = pattern.indexOf(">", i + 3);
        if (nameEnd !== -1) {
          const name = pattern.substring(i + 3, nameEnd);
          parts.push(`a group named '${name}' containing:`);
          i = nameEnd + 1;
          continue;
        }
      }
      parts.push("a capturing group containing:");
      i++;
      continue;
    }

    if (ch === ")") {
      parts.push("(end of group)");
      i++;
      continue;
    }

    // Quantifiers
    if (ch === "*") {
      const lazy = pattern[i + 1] === "?";
      parts.push(
        lazy
          ? "repeated zero or more times (as few as possible)"
          : "repeated zero or more times"
      );
      i += lazy ? 2 : 1;
      continue;
    }

    if (ch === "+") {
      const lazy = pattern[i + 1] === "?";
      parts.push(
        lazy
          ? "repeated one or more times (as few as possible)"
          : "repeated one or more times"
      );
      i += lazy ? 2 : 1;
      continue;
    }

    if (ch === "?") {
      parts.push("optionally (zero or one time)");
      i++;
      continue;
    }

    if (ch === "{") {
      const braceEnd = pattern.indexOf("}", i);
      if (braceEnd !== -1) {
        const q = pattern.substring(i + 1, braceEnd);
        const nums = q.split(",");
        if (nums.length === 1) {
          parts.push(`repeated exactly ${nums[0]} times`);
        } else if (nums[1] === "") {
          parts.push(`repeated ${nums[0]} or more times`);
        } else {
          parts.push(`repeated between ${nums[0]} and ${nums[1]} times`);
        }
        i = braceEnd + 1;
        continue;
      }
    }

    // Anchors and special
    if (ch === "^") {
      parts.push("at the start of the string");
      i++;
      continue;
    }
    if (ch === "$") {
      parts.push("at the end of the string");
      i++;
      continue;
    }
    if (ch === ".") {
      parts.push("any character (except newline)");
      i++;
      continue;
    }
    if (ch === "|") {
      parts.push("OR");
      i++;
      continue;
    }

    // Literal character
    parts.push(`the character '${ch}'`);
    i++;
  }

  return parts.join(", then ");
}

function execute(input: Input): Output {
  const pattern = input.input.trim();
  if (!pattern) throw new Error("Pattern cannot be empty");

  try {
    new RegExp(pattern);
  } catch (e) {
    throw new Error(`Invalid regex: ${(e as Error).message}`);
  }

  const explanation = explainPattern(pattern);
  const lines: string[] = [];
  lines.push(`Pattern: /${pattern}/`);
  lines.push("");
  lines.push("This regex matches: " + explanation);

  return { output: lines.join("\n") };
}

export const regexExplainer = defineTool({
  meta: {
    id: "regex/regex-explainer",
    name: "Regex Explainer",
    description:
      "Free online regex explainer — break down any regular expression into plain English descriptions instantly in your browser. No data is stored. Explains character classes, quantifiers, groups, anchors, and lookaheads.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "explain",
      "plain english",
      "describe",
      "understand",
      "plain-english",
      "learn",
      "read",
      "decode",
    ],
    examples: [
      {
        title: "Explain email validation regex in plain English",
        description:
          "Get a plain English explanation of an email validation regex",
        input: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        output:
          "Pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/\n\nThis regex matches: at the start of the string, then any character in [a-zA-Z0-9._%+-], then repeated one or more times, then the character '@', then any character in [a-zA-Z0-9.-], then repeated one or more times, then the literal character '.', then any character in [a-zA-Z], then repeated 2 or more times, then at the end of the string",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
