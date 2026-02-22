import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("YAML string to lint"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the YAML is valid"),
  issues: z
    .array(
      z.object({
        line: z.number().describe("Line number"),
        column: z.number().optional().describe("Column number"),
        severity: z.enum(["error", "warning"]).describe("Issue severity"),
        message: z.string().describe("Issue message"),
        rule: z.string().optional().describe("Rule name"),
      })
    )
    .describe("List of issues found"),
  documentCount: z.number().describe("Number of YAML documents"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface LintIssue {
  line: number;
  column?: number;
  severity: "error" | "warning";
  message: string;
  rule?: string;
}

/**
 * Lint YAML for common issues.
 */
function lintYaml(input: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = input.split("\n");

  // Check for tabs (YAML should use spaces)
  lines.forEach((line, index) => {
    if (line.includes("\t")) {
      issues.push({
        line: index + 1,
        severity: "warning",
        message: "Tab characters should not be used in YAML",
        rule: "no-tabs",
      });
    }
  });

  // Check for trailing whitespace
  lines.forEach((line, index) => {
    if (line !== line.trimEnd() && line.trim().length > 0) {
      issues.push({
        line: index + 1,
        severity: "warning",
        message: "Trailing whitespace",
        rule: "no-trailing-spaces",
      });
    }
  });

  // Check for inconsistent indentation
  let baseIndent: number | null = null;
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    if (trimmed.length > 0 && !trimmed.startsWith("#")) {
      const indent = line.length - trimmed.length;
      if (indent > 0) {
        if (baseIndent === null) {
          baseIndent = indent;
        } else if (indent % baseIndent !== 0 && indent !== baseIndent) {
          issues.push({
            line: index + 1,
            severity: "warning",
            message: `Inconsistent indentation (${indent} spaces, expected multiple of ${baseIndent})`,
            rule: "indentation",
          });
        }
      }
    }
  });

  // Check for duplicate keys at root level
  const rootKeys = new Set<string>();
  lines.forEach((line, index) => {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/);
    if (match && match[1]) {
      const key = match[1];
      if (rootKeys.has(key)) {
        issues.push({
          line: index + 1,
          severity: "error",
          message: `Duplicate key: ${key}`,
          rule: "no-duplicate-keys",
        });
      }
      rootKeys.add(key);
    }
  });

  // Check for empty document
  if (input.trim().length === 0) {
    issues.push({
      line: 1,
      severity: "warning",
      message: "Empty document",
      rule: "no-empty",
    });
  }

  // Check for very long lines
  lines.forEach((line, index) => {
    if (line.length > 120) {
      issues.push({
        line: index + 1,
        severity: "warning",
        message: `Line too long (${line.length} > 120 characters)`,
        rule: "line-length",
      });
    }
  });

  return issues;
}

/**
 * Count YAML documents in a multi-document string.
 */
function countDocuments(input: string): number {
  const docs: unknown[] = [];
  yaml.loadAll(input, (doc) => docs.push(doc));
  return docs.length;
}

/**
 * Lints YAML for syntax and style issues.
 */
function execute(input: Input): Output {
  const issues: LintIssue[] = [];
  let valid = true;
  let documentCount = 0;

  // First, check for syntax errors
  try {
    documentCount = countDocuments(input.input);
  } catch (err) {
    valid = false;
    const message = err instanceof Error ? err.message : "Parse error";
    const lineMatch = message.match(/line (\d+)/i);
    const colMatch = message.match(/column (\d+)/i);

    const issue: LintIssue = {
      line: lineMatch && lineMatch[1] ? parseInt(lineMatch[1], 10) : 1,
      severity: "error",
      message: `Syntax error: ${message}`,
      rule: "syntax",
    };
    if (colMatch && colMatch[1]) {
      issue.column = parseInt(colMatch[1], 10);
    }
    issues.push(issue);
  }

  // Then, perform style checks
  if (valid) {
    const styleIssues = lintYaml(input.input);
    issues.push(...styleIssues);
  }

  return {
    valid,
    issues,
    documentCount,
  };
}

/**
 * YAML Lint tool.
 * Checks YAML for syntax and style issues.
 */
export const yamlLint = defineTool({
  meta: {
    id: "yaml/lint",
    name: "YAML Lint",
    description:
      "Free online YAML linter — check YAML for syntax errors and style issues instantly in your browser. No data is stored. Detects tabs, trailing whitespace, inconsistent indentation, long lines, and duplicate keys.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "lint",
      "validate",
      "check",
      "style",
      "syntax",
      "error",
      "warning",
      "best-practices",
    ],
    examples: [
      {
        title: "Valid YAML with no issues",
        description: "Lint a well-formed YAML document — no warnings or errors",
        input: "name: Alice\nage: 30\nroles:\n  - admin\n  - user",
        output: '{"valid":true,"issues":[],"documentCount":1}',
      },
      {
        title: "Detect trailing whitespace and long lines",
        description:
          "Find style issues like trailing spaces and lines over 120 characters",
        input: `name: Alice\nage: 30\ncity: Portland  \ndescription: ${"A".repeat(110)}`,
        output: `{"valid":true,"issues":[{"line":3,"severity":"warning","message":"Trailing whitespace","rule":"no-trailing-spaces"},{"line":4,"severity":"warning","message":"Line too long (123 > 120 characters)","rule":"line-length"}],"documentCount":1}`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
