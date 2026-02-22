import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe(".gitignore content"),
});
const optionsSchema = z.object({
  filePath: z.string().default("src/index.ts").describe("File path to check"),
});
const outputSchema = z.object({ output: z.string().describe("Check results") });

function matchPattern(pattern: string, filePath: string): boolean {
  const negated = pattern.startsWith("!");
  const p = negated ? pattern.slice(1) : pattern;
  const parts = filePath.split("/");

  // Convert gitignore glob to regex-like matching
  let regexStr = p
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  // If pattern ends with /, match directories
  if (regexStr.endsWith("/")) regexStr = regexStr + ".*";
  // If pattern doesn't start with /, it can match anywhere
  if (!regexStr.startsWith("/") && !regexStr.startsWith(".*"))
    regexStr = "(.*/)?" + regexStr;
  else if (regexStr.startsWith("/")) regexStr = regexStr.slice(1);

  try {
    const regex = new RegExp(`^${regexStr}$`);
    const matches =
      regex.test(filePath) ||
      parts.some((_, i) => regex.test(parts.slice(0, i + 1).join("/")));
    return negated ? !matches : matches;
  } catch {
    return false;
  }
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const gitignore = input.input.trim();
  if (!gitignore) throw new Error("Input cannot be empty");
  const filePath = options?.filePath ?? "src/index.ts";

  const patterns = gitignore
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const matchedPatterns: Array<{ pattern: string; ignored: boolean }> = [];
  let isIgnored = false;

  for (const pattern of patterns) {
    const matches = matchPattern(pattern, filePath);
    if (matches) {
      const negated = pattern.startsWith("!");
      isIgnored = !negated;
      matchedPatterns.push({ pattern, ignored: !negated });
    }
  }

  const lines: string[] = [];
  lines.push(`File: ${filePath}`);
  lines.push(`Status: ${isIgnored ? "IGNORED" : "NOT IGNORED"}`);
  lines.push("");
  if (matchedPatterns.length > 0) {
    lines.push("Matching patterns:");
    for (const m of matchedPatterns) {
      lines.push(`  ${m.pattern} -> ${m.ignored ? "ignores" : "includes"}`);
    }
  } else {
    lines.push("No matching patterns found.");
  }

  return { output: lines.join("\n") };
}

export const gitIgnoreChecker = defineTool({
  meta: {
    id: "git/git-ignore-checker",
    name: "Git Ignore Checker",
    description:
      "Free online .gitignore checker — paste your .gitignore rules and test whether a file path is ignored or tracked instantly in your browser. No data is stored. Shows matching patterns, supports negation rules, globs, directory patterns, and comments.",
    category: "git",
    tier: ToolTier.CLIENT,
    keywords: [
      "git",
      "gitignore",
      "check",
      "match",
      "pattern",
      "glob",
      "ignore",
      "tracked",
    ],
    examples: [
      {
        title: "Check source file against common rules",
        description:
          "Verify that src/index.ts is not ignored by standard .gitignore patterns (change the File path option to test other files)",
        input: "node_modules/\n.env\n.env.local\ndist/\n*.log",
        output:
          "File: src/index.ts\nStatus: NOT IGNORED\n\nNo matching patterns found.",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
