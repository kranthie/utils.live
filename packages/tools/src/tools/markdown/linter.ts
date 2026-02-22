import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown text to lint"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the Markdown passes lint"),
  issues: z
    .array(
      z.object({
        line: z.number(),
        severity: z.enum(["error", "warning"]),
        rule: z.string(),
        message: z.string(),
      })
    )
    .describe("Lint issues found"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface LintIssue {
  line: number;
  severity: "error" | "warning";
  rule: string;
  message: string;
}

/**
 * Lint Markdown for common issues.
 */
function lintMarkdown(input: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = input.split("\n");

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check for trailing whitespace
    if (line !== line.trimEnd() && line.trim().length > 0) {
      issues.push({
        line: lineNum,
        severity: "warning",
        rule: "no-trailing-spaces",
        message: "Trailing whitespace",
      });
    }

    // Check for multiple consecutive blank lines
    if (
      index > 0 &&
      line.trim() === "" &&
      lines[index - 1]?.trim() === "" &&
      index > 1 &&
      lines[index - 2]?.trim() === ""
    ) {
      issues.push({
        line: lineNum,
        severity: "warning",
        rule: "no-multiple-blanks",
        message: "Multiple consecutive blank lines",
      });
    }

    // Check for headers without space after #
    if (/^#{1,6}[^#\s]/.test(line)) {
      issues.push({
        line: lineNum,
        severity: "error",
        rule: "no-missing-space-header",
        message: "Header missing space after #",
      });
    }

    // Check for very long lines
    if (line.length > 120 && !line.startsWith("|") && !line.includes("](")) {
      issues.push({
        line: lineNum,
        severity: "warning",
        rule: "line-length",
        message: `Line too long (${line.length} > 120)`,
      });
    }

    // Check for bare URLs (not in links)
    if (
      /(?<!\()(https?:\/\/[^\s)]+)(?!\))/.test(line) &&
      !line.includes("](")
    ) {
      issues.push({
        line: lineNum,
        severity: "warning",
        rule: "no-bare-urls",
        message: "Bare URL should be in a link or code block",
      });
    }

    // Check for tabs
    if (line.includes("\t")) {
      issues.push({
        line: lineNum,
        severity: "warning",
        rule: "no-tabs",
        message: "Tabs should be replaced with spaces",
      });
    }
  });

  // Check for missing newline at end
  if (input.length > 0 && !input.endsWith("\n")) {
    issues.push({
      line: lines.length,
      severity: "warning",
      rule: "final-newline",
      message: "File should end with a newline",
    });
  }

  return issues;
}

/**
 * Lints Markdown for style issues.
 */
function execute(input: Input): Output {
  const issues = lintMarkdown(input.input);
  const valid = !issues.some((i) => i.severity === "error");

  return { valid, issues };
}

/**
 * Markdown Linter tool.
 * Checks Markdown for style issues.
 */
export const markdownLinter = defineTool({
  meta: {
    id: "markdown/linter",
    name: "Markdown Linter",
    description:
      "Free online Markdown linter — check Markdown for style issues like trailing whitespace, missing heading spaces, excessive blank lines, bare URLs, and tabs instantly in your browser. No data is stored. Reports errors and warnings with line numbers and rule names.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "lint", "style", "check"],
    examples: [
      {
        title: "Lint Markdown for issues",
        description: "Check Markdown for common style problems",
        input: "#Missing space\n\nSome text\n\n\n\nToo many blank lines",
        output:
          '{\n  "valid": false,\n  "issues": [\n    {\n      "line": 1,\n      "severity": "error",\n      "rule": "no-missing-space-header",\n      "message": "Header missing space after #"\n    },\n    {\n      "line": 6,\n      "severity": "warning",\n      "rule": "no-multiple-blanks",\n      "message": "Multiple consecutive blank lines"\n    },\n    {\n      "line": 7,\n      "severity": "warning",\n      "rule": "final-newline",\n      "message": "File should end with a newline"\n    }\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
