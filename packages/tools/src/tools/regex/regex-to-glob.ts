import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Simple regex pattern to convert to glob"),
});

const outputSchema = z.object({
  output: z.string().describe("Equivalent glob pattern (best approximation)"),
  exact: z.boolean().describe("Whether the conversion is exact"),
  notes: z.array(z.string()).describe("Conversion notes and warnings"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let pattern = input.input.trim();
  if (!pattern) throw new Error("Pattern cannot be empty");

  const notes: string[] = [];
  let exact = true;

  // Strip anchors
  if (pattern.startsWith("^")) pattern = pattern.slice(1);
  if (pattern.endsWith("$")) pattern = pattern.slice(0, -1);

  let glob = "";
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern[i]!;

    if (ch === "\\") {
      // Escaped character - take literally
      if (i + 1 < pattern.length) {
        const next = pattern[i + 1]!;
        if (next === "d" || next === "w" || next === "s") {
          notes.push(`\\${next} has no glob equivalent, using ?`);
          glob += "?";
          exact = false;
        } else {
          glob += next;
        }
        i += 2;
      } else {
        glob += "\\";
        i++;
      }
      continue;
    }

    if (ch === ".") {
      if (pattern[i + 1] === "*") {
        // .* -> **
        glob += "**";
        i += 2;
        continue;
      }
      if (pattern[i + 1] === "+") {
        // .+ -> *? (approximate)
        glob += "*";
        exact = false;
        notes.push(".+ converted to * (glob cannot enforce 1+ chars)");
        i += 2;
        continue;
      }
      // Single . -> ?
      glob += "?";
      i++;
      continue;
    }

    if (ch === "[") {
      // Character classes can carry over
      let end = i + 1;
      while (end < pattern.length && pattern[end] !== "]") {
        if (pattern[end] === "\\") end++;
        end++;
      }
      glob += pattern.substring(i, end + 1);
      i = end + 1;
      continue;
    }

    if (ch === "(") {
      // Groups - try to convert alternation to {a,b}
      let depth = 1;
      let end = i + 1;
      while (end < pattern.length && depth > 0) {
        if (pattern[end] === "(") depth++;
        if (pattern[end] === ")") depth--;
        if (pattern[end] === "\\") end++;
        end++;
      }
      const group = pattern.substring(i + 1, end - 1);
      if (group.includes("|") && !group.includes("(")) {
        // Simple alternation
        glob += "{" + group.replace(/\|/g, ",") + "}";
      } else {
        notes.push("Complex group expression approximated");
        glob += "{" + group.replace(/\|/g, ",") + "}";
        exact = false;
      }
      i = end;
      continue;
    }

    if (ch === "+" || ch === "{" || ch === "}" || ch === "?") {
      notes.push(`Quantifier '${ch}' has no exact glob equivalent`);
      if (ch === "+") {
        glob += "*";
      }
      exact = false;
      i++;
      continue;
    }

    if (ch === "*") {
      glob += "*";
      i++;
      continue;
    }

    glob += ch;
    i++;
  }

  return { output: glob, exact, notes };
}

export const regexToGlob = defineTool({
  meta: {
    id: "regex/regex-to-glob",
    name: "Regex to Glob",
    description:
      "Free online regex to glob converter — convert simple regular expression patterns to glob wildcard equivalents instantly in your browser. No data is stored. Provides conversion notes when patterns can't be exactly represented.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "glob",
      "convert",
      "pattern",
      "wildcard",
      "file",
      "shell",
      "minimatch",
    ],
    examples: [
      {
        title: "Convert JS file regex to glob pattern",
        description:
          "Convert a regex matching JavaScript files to a glob pattern",
        input: "^.*\\.js$",
        output: "**.js",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
