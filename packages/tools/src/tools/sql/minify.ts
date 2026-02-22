import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("SQL query to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified SQL query"),
  originalLength: z.number().describe("Original character count"),
  minifiedLength: z.number().describe("Minified character count"),
  savings: z.string().describe("Percentage of characters saved"),
});

const optionsSchema = z.object({
  removeComments: z.boolean().default(true).describe("Remove SQL comments"),
  preserveStrings: z
    .boolean()
    .default(true)
    .describe("Preserve string literal whitespace"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Minifies a SQL query by removing unnecessary whitespace and optionally comments.
 */
function execute(input: Input, options?: Options): Output {
  const sql = input.input;
  if (!sql.trim()) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "SQL input is empty",
    });
  }

  const removeComments = options?.removeComments ?? true;
  const originalLength = sql.length;

  // Process character by character to handle strings and comments properly
  let result = "";
  let i = 0;

  while (i < sql.length) {
    // Single-line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      if (removeComments) {
        while (i < sql.length && sql[i] !== "\n") {
          i++;
        }
        // Replace comment with a space to avoid merging tokens
        result += " ";
        continue;
      } else {
        while (i < sql.length && sql[i] !== "\n") {
          result += sql[i];
          i++;
        }
        continue;
      }
    }

    // Multi-line comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      if (removeComments) {
        i += 2;
        while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
          i++;
        }
        if (i < sql.length) {
          i += 2;
        }
        result += " ";
        continue;
      } else {
        result += "/*";
        i += 2;
        while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
          result += sql[i];
          i++;
        }
        if (i < sql.length) {
          result += "*/";
          i += 2;
        }
        continue;
      }
    }

    // String literal (single quotes)
    if (sql[i] === "'") {
      result += "'";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          result += "''";
          i += 2;
        } else if (sql[i] === "'") {
          result += "'";
          i++;
          break;
        } else {
          result += sql[i];
          i++;
        }
      }
      continue;
    }

    // String literal (double quotes)
    if (sql[i] === '"') {
      result += '"';
      i++;
      while (i < sql.length && sql[i] !== '"') {
        result += sql[i];
        i++;
      }
      if (i < sql.length) {
        result += '"';
        i++;
      }
      continue;
    }

    // Backtick identifiers
    if (sql[i] === "`") {
      result += "`";
      i++;
      while (i < sql.length && sql[i] !== "`") {
        result += sql[i];
        i++;
      }
      if (i < sql.length) {
        result += "`";
        i++;
      }
      continue;
    }

    // Whitespace: collapse to single space
    if (/\s/.test(sql[i]!)) {
      // Only add space if the previous char isn't already a space
      // and we're not at the start
      if (result.length > 0 && result[result.length - 1] !== " ") {
        result += " ";
      }
      i++;
      while (i < sql.length && /\s/.test(sql[i]!)) {
        i++;
      }
      continue;
    }

    result += sql[i];
    i++;
  }

  // Clean up spaces around punctuation
  let output = result.trim();
  output = output.replace(/\s*,\s*/g, ",");
  output = output.replace(/\s*\(\s*/g, "(");
  output = output.replace(/\s*\)\s*/g, ")");
  output = output.replace(/\s*;\s*/g, ";");
  // Put space after commas and semicolons where needed for readability
  output = output.replace(/,(?=\S)/g, ", ");
  // Ensure space after closing paren when followed by a word
  output = output.replace(/\)(?=[a-zA-Z])/g, ") ");
  // Ensure space before opening paren only when preceded by a word
  output = output.replace(/([a-zA-Z0-9_])(?=\()/g, "$1 ");

  const minifiedLength = output.length;
  const savingsPercent =
    originalLength > 0
      ? (((originalLength - minifiedLength) / originalLength) * 100).toFixed(1)
      : "0.0";

  return {
    output,
    originalLength,
    minifiedLength,
    savings: `${savingsPercent}%`,
  };
}

/**
 * SQL Minifier tool.
 * Removes unnecessary whitespace from SQL queries.
 */
export const sqlMinify = defineTool({
  meta: {
    id: "sql/minify",
    name: "SQL Minifier",
    description:
      "Free online SQL minifier — compress SQL queries by removing whitespace, comments, and unnecessary formatting instantly in your browser. No data is stored. Preserves string literals and query semantics.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "minify", "compress", "whitespace", "compact"],
    examples: [
      {
        title: "Minify SELECT Query",
        description:
          "Remove unnecessary whitespace and comments from a SQL query",
        input:
          "SELECT\n  name,\n  email\nFROM\n  users\nWHERE\n  active = true\n  -- only active users\n  AND age > 18;",
        output:
          "SELECT name, email FROM users WHERE active = true  AND age > 18;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
