import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Regex pattern to optimize"),
});

const outputSchema = z.object({
  output: z.string().describe("Optimized regex pattern"),
  suggestions: z.array(z.string()).describe("Optimization suggestions"),
  original: z.string().describe("Original pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const pattern = input.input.trim();
  if (!pattern) throw new Error("Pattern cannot be empty");

  try {
    new RegExp(pattern);
  } catch (e) {
    throw new Error(`Invalid regex: ${(e as Error).message}`);
  }

  const suggestions: string[] = [];
  let optimized = pattern;

  // 1. Replace [0-9] with \d
  if (/\[0-9\]/.test(optimized)) {
    optimized = optimized.replace(/\[0-9\]/g, "\\d");
    suggestions.push("Replaced [0-9] with \\d (shorter character class)");
  }

  // 2. Replace [a-zA-Z0-9_] with \w
  if (/\[a-zA-Z0-9_\]/.test(optimized)) {
    optimized = optimized.replace(/\[a-zA-Z0-9_\]/g, "\\w");
    suggestions.push("Replaced [a-zA-Z0-9_] with \\w");
  }

  // 3. Replace [ \t\n\r\f] with \s
  if (/\[ \\t\\n\\r\\f\]/.test(optimized)) {
    optimized = optimized.replace(/\[ \\t\\n\\r\\f\]/g, "\\s");
    suggestions.push("Replaced whitespace character class with \\s");
  }

  // 4. Replace {0,1} with ?
  if (/\{0,1\}/.test(optimized)) {
    optimized = optimized.replace(/\{0,1\}/g, "?");
    suggestions.push("Replaced {0,1} with ? (equivalent but shorter)");
  }

  // 5. Replace {1,} with +
  if (/\{1,\}/.test(optimized)) {
    optimized = optimized.replace(/\{1,\}/g, "+");
    suggestions.push("Replaced {1,} with + (equivalent but shorter)");
  }

  // 6. Replace {0,} with *
  if (/\{0,\}/.test(optimized)) {
    optimized = optimized.replace(/\{0,\}/g, "*");
    suggestions.push("Replaced {0,} with * (equivalent but shorter)");
  }

  // 7. Detect nested quantifiers (catastrophic backtracking risk)
  if (/(\+|\*)\+|(\+|\*)\*/.test(optimized)) {
    suggestions.push(
      "WARNING: Nested quantifiers detected (e.g., a*+ or a**). This can cause catastrophic backtracking."
    );
  }

  // 8. Detect (.*) which is often too greedy
  if (/\(\.\*\)/.test(optimized)) {
    suggestions.push(
      "Consider using (.*?) instead of (.*) for non-greedy matching to avoid excessive backtracking"
    );
  }

  // 9. Single-char character classes [a] -> a
  const singleCharClass = optimized.match(/\[([^\\\]^])\]/g);
  if (singleCharClass) {
    for (const cls of singleCharClass) {
      const ch = cls[1]!;
      if (!".*+?^${}()|[]\\".includes(ch)) {
        optimized = optimized.replace(cls, ch);
        suggestions.push(
          `Replaced ${cls} with '${ch}' (unnecessary character class)`
        );
      }
    }
  }

  // 10. Replace [^\d] with \D, [^\w] with \W, [^\s] with \S
  if (/\[\^\\d\]/.test(optimized)) {
    optimized = optimized.replace(/\[\^\\d\]/g, "\\D");
    suggestions.push("Replaced [^\\d] with \\D");
  }
  if (/\[\^\\w\]/.test(optimized)) {
    optimized = optimized.replace(/\[\^\\w\]/g, "\\W");
    suggestions.push("Replaced [^\\w] with \\W");
  }
  if (/\[\^\\s\]/.test(optimized)) {
    optimized = optimized.replace(/\[\^\\s\]/g, "\\S");
    suggestions.push("Replaced [^\\s] with \\S");
  }

  // 11. Detect .* at start
  if (/^\.\*/.test(optimized) && !optimized.startsWith(".*?")) {
    suggestions.push(
      "Pattern starts with '.*' which will scan the entire string. Consider using a more specific anchor or prefix."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("No obvious optimizations found. Pattern looks good!");
  }

  return {
    output: optimized,
    suggestions,
    original: pattern,
  };
}

export const regexOptimizer = defineTool({
  meta: {
    id: "regex/regex-optimizer",
    name: "Regex Optimizer",
    description:
      "Free online regex optimizer — suggest shorter, more readable regular expression alternatives instantly in your browser. No data is stored. Simplifies character classes, quantifiers, and common patterns.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "optimize",
      "improve",
      "performance",
      "simplify",
      "shorten",
      "refactor",
      "readable",
    ],
    examples: [
      {
        title: "Simplify character classes and quantifiers",
        description:
          "Optimize a regex by replacing verbose character classes with shortcuts",
        input: "[0-9]+[a-zA-Z0-9_]{0,1}",
        output: "\\d+\\w?",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
