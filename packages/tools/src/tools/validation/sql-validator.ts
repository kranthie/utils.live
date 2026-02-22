import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

const SQL_KEYWORDS = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "TRUNCATE",
  "WITH",
  "EXPLAIN",
  "MERGE",
  "REPLACE",
  "GRANT",
  "REVOKE",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
  "SET",
  "SHOW",
  "DESCRIBE",
  "USE",
];

export const sqlValidator = defineTool({
  meta: {
    id: "validation/sql-validator",
    name: "SQL Validator",
    description:
      "Free online SQL syntax validator — check your SQL queries for basic syntax errors instantly in your browser. No data is stored. Validates SELECT, INSERT, UPDATE, DELETE, and CREATE statements.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "query",
      "validate",
      "syntax",
      "database",
      "select",
      "insert",
      "statement",
    ],
    examples: [
      {
        title: "Valid SELECT Query",
        description: "Validate a standard SQL SELECT statement",
        input:
          "SELECT id, name, email FROM users WHERE active = true ORDER BY name",
        output: "Valid SQL (SELECT statement)",
      },
      {
        title: "Unmatched Parenthesis",
        description: "Detect an unmatched parenthesis in SQL",
        input: "SELECT * FROM users WHERE (active = true AND (role = 'admin'",
        output: "SQL issues:\n  - 1 unclosed parenthesis(es)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const sql = input.input.trim();
    if (!sql)
      return {
        output: "Empty SQL",
        isValid: false,
        errors: ["No SQL provided"],
      };
    const errors: string[] = [];
    // Remove comments and strings
    const cleaned = sql
      .replace(/--[^\n]*/g, "")
      .replace(/'[^']*'/g, "''")
      .trim();
    // Check starts with valid keyword
    const firstWord = (cleaned.split(/\s+/)[0] ?? "").toUpperCase();
    if (!SQL_KEYWORDS.includes(firstWord)) {
      errors.push(
        `Statement should start with a SQL keyword (got: ${firstWord})`
      );
    }
    // Check balanced parentheses
    let parenCount = 0;
    for (const c of cleaned) {
      if (c === "(") parenCount++;
      if (c === ")") parenCount--;
      if (parenCount < 0) {
        errors.push("Unmatched closing parenthesis");
        break;
      }
    }
    if (parenCount > 0) errors.push(`${parenCount} unclosed parenthesis(es)`);
    // Check SELECT has FROM (unless subquery or simple select)
    if (
      firstWord === "SELECT" &&
      !cleaned.toUpperCase().includes("FROM") &&
      !cleaned.includes("(")
    ) {
      // Simple SELECT without FROM is valid in some dialects
    }
    const isValid = errors.length === 0;
    return {
      output: isValid
        ? `Valid SQL (${firstWord} statement)`
        : `SQL issues:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
