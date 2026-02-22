import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("String to escape for SQL"),
});

const outputSchema = z.object({
  output: z.string().describe("Escaped SQL string"),
  escapedCharCount: z
    .number()
    .describe("Number of characters that were escaped"),
  wrappedInQuotes: z
    .string()
    .describe("Escaped string wrapped in single quotes"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite", "mssql"])
    .default("standard")
    .describe("SQL dialect for escaping rules"),
  quoteStyle: z
    .enum(["single", "double"])
    .default("single")
    .describe("Quote style to escape for"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Escapes special characters in SQL strings.
 */
function execute(input: Input, options?: Options): Output {
  const str = input.input;
  const dialect = options?.dialect ?? "standard";
  const quoteStyle = options?.quoteStyle ?? "single";

  if (str === "") {
    return {
      output: "",
      escapedCharCount: 0,
      wrappedInQuotes: quoteStyle === "single" ? "''" : '""',
    };
  }

  let result = "";
  let escapedCount = 0;
  const quoteChar = quoteStyle === "single" ? "'" : '"';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]!;

    if (ch === "'") {
      if (dialect === "mysql") {
        result += "\\'";
      } else {
        // Standard SQL: double the single quote
        result += "''";
      }
      escapedCount++;
      continue;
    }

    if (ch === '"') {
      if (dialect === "mysql") {
        result += '\\"';
      } else {
        result += '""';
      }
      escapedCount++;
      continue;
    }

    if (ch === "\\") {
      if (dialect === "mysql") {
        result += "\\\\";
        escapedCount++;
        continue;
      }
      // Standard SQL doesn't need backslash escaping
      result += ch;
      continue;
    }

    if (ch === "\0") {
      if (dialect === "mysql") {
        result += "\\0";
      } else {
        result += ""; // Remove null bytes
      }
      escapedCount++;
      continue;
    }

    if (ch === "\n") {
      if (dialect === "mysql") {
        result += "\\n";
        escapedCount++;
        continue;
      }
      result += ch;
      continue;
    }

    if (ch === "\r") {
      if (dialect === "mysql") {
        result += "\\r";
        escapedCount++;
        continue;
      }
      result += ch;
      continue;
    }

    if (ch === "\t") {
      if (dialect === "mysql") {
        result += "\\t";
        escapedCount++;
        continue;
      }
      result += ch;
      continue;
    }

    if (ch === "\x1a") {
      // Ctrl+Z (MySQL specific)
      if (dialect === "mysql") {
        result += "\\Z";
        escapedCount++;
        continue;
      }
      result += ch;
      continue;
    }

    // PostgreSQL dollar-sign quoting doesn't need escaping of special chars
    // but we still escape quotes for standard usage
    if (ch === "%" || ch === "_") {
      // These are LIKE wildcards - escape them if needed
      // Only escape if the result will be used in LIKE context
      result += ch;
      continue;
    }

    result += ch;
  }

  const wrappedInQuotes = `${quoteChar}${result}${quoteChar}`;

  return {
    output: result,
    escapedCharCount: escapedCount,
    wrappedInQuotes,
  };
}

/**
 * SQL Escape tool.
 * Escapes special characters in strings for safe SQL usage.
 */
export const sqlEscape = defineTool({
  meta: {
    id: "sql/escape",
    name: "SQL Escape",
    description:
      "Free online SQL escape tool — escape special characters in SQL strings to prevent syntax errors instantly in your browser. No data is stored. Supports MySQL, PostgreSQL, SQLite, and MSSQL escaping rules.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "escape", "quote", "inject", "sanitize", "security"],
    examples: [
      {
        title: "Escape User Input",
        description:
          "Escape a string containing single quotes for safe SQL insertion",
        input: "O'Brien's \"test\" value",
        output: "O''Brien''s \"\"test\"\" value",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
