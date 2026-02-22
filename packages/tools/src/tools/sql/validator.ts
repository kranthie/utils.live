import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to validate"),
});

const outputSchema = z.object({
  valid: z.boolean().describe("Whether the SQL syntax is valid"),
  errors: z
    .array(
      z.object({
        message: z.string(),
        position: z.number().optional(),
        line: z.number().optional(),
        column: z.number().optional(),
      })
    )
    .describe("List of syntax errors found"),
  warnings: z
    .array(
      z.object({
        message: z.string(),
        position: z.number().optional(),
      })
    )
    .describe("List of warnings"),
  statementCount: z.number().describe("Number of SQL statements found"),
  statementTypes: z.array(z.string()).describe("Types of statements found"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect for validation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface ValidationError {
  message: string;
  position?: number;
  line?: number;
  column?: number;
}

interface ValidationWarning {
  message: string;
  position?: number;
}

/**
 * Gets line and column from a position in the input string.
 */
function getLineCol(
  sql: string,
  pos: number
): { line: number; column: number } {
  const lines = sql.substring(0, pos).split("\n");
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
  };
}

/**
 * Validates SQL syntax.
 */
function execute(input: Input, options?: Options): Output {
  const sql = input.input.trim();
  const dialect = options?.dialect ?? "standard";

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const statementTypes: string[] = [];

  if (!sql) {
    return {
      valid: false,
      errors: [{ message: "SQL input is empty" }],
      warnings: [],
      statementCount: 0,
      statementTypes: [],
    };
  }

  // Split into statements
  const statements = splitStatements(sql);
  let statementCount = 0;

  for (const stmt of statements) {
    const trimmed = stmt.text.trim();
    if (!trimmed) continue;

    statementCount++;
    const stmtErrors = validateStatement(trimmed, sql, stmt.offset, dialect);
    errors.push(...stmtErrors.errors);
    warnings.push(...stmtErrors.warnings);
    if (stmtErrors.type) {
      statementTypes.push(stmtErrors.type);
    }
  }

  // Global checks
  const globalErrors = validateGlobal(sql);
  errors.push(...globalErrors.errors);
  warnings.push(...globalErrors.warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    statementCount,
    statementTypes,
  };
}

interface StatementPart {
  text: string;
  offset: number;
}

/**
 * Splits SQL into individual statements, respecting strings.
 */
function splitStatements(sql: string): StatementPart[] {
  const parts: StatementPart[] = [];
  let current = "";
  let offset = 0;
  let i = 0;

  while (i < sql.length) {
    // Handle string literals
    if (sql[i] === "'") {
      current += "'";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          current += "''";
          i += 2;
        } else if (sql[i] === "'") {
          current += "'";
          i++;
          break;
        } else {
          current += sql[i];
          i++;
        }
      }
      continue;
    }

    // Handle comments
    if (sql[i] === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") {
        current += sql[i];
        i++;
      }
      continue;
    }

    if (sql[i] === "/" && sql[i + 1] === "*") {
      current += "/*";
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
        current += sql[i];
        i++;
      }
      if (i < sql.length) {
        current += "*/";
        i += 2;
      }
      continue;
    }

    if (sql[i] === ";") {
      parts.push({ text: current, offset });
      current = "";
      offset = i + 1;
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  if (current.trim()) {
    parts.push({ text: current, offset });
  }

  return parts;
}

/**
 * Validates a single SQL statement.
 */
function validateStatement(
  stmt: string,
  fullSql: string,
  offset: number,
  dialect: string
): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  type: string | null;
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const upper = stmt.toUpperCase().replace(/\s+/g, " ").trim();

  // Detect statement type
  let type: string | null = null;
  if (upper.startsWith("SELECT")) type = "SELECT";
  else if (upper.startsWith("INSERT")) type = "INSERT";
  else if (upper.startsWith("UPDATE")) type = "UPDATE";
  else if (upper.startsWith("DELETE")) type = "DELETE";
  else if (upper.startsWith("CREATE TABLE")) type = "CREATE TABLE";
  else if (upper.startsWith("CREATE INDEX")) type = "CREATE INDEX";
  else if (upper.startsWith("CREATE VIEW")) type = "CREATE VIEW";
  else if (upper.startsWith("CREATE")) type = "CREATE";
  else if (upper.startsWith("ALTER")) type = "ALTER";
  else if (upper.startsWith("DROP")) type = "DROP";
  else if (upper.startsWith("WITH")) type = "WITH (CTE)";
  else if (upper.startsWith("TRUNCATE")) type = "TRUNCATE";
  else if (upper.startsWith("GRANT")) type = "GRANT";
  else if (upper.startsWith("REVOKE")) type = "REVOKE";
  else if (upper.startsWith("BEGIN") || upper.startsWith("START"))
    type = "TRANSACTION";
  else if (upper.startsWith("COMMIT")) type = "COMMIT";
  else if (upper.startsWith("ROLLBACK")) type = "ROLLBACK";
  else if (upper.startsWith("EXPLAIN")) type = "EXPLAIN";
  else {
    const { line, column } = getLineCol(fullSql, offset);
    errors.push({
      message: `Unrecognized statement type: "${stmt.split(/\s/)[0]}"`,
      position: offset,
      line,
      column,
    });
  }

  // Check balanced parentheses
  let parenDepth = 0;
  let inString = false;
  let stringChar = "";
  for (let i = 0; i < stmt.length; i++) {
    const ch = stmt[i]!;

    if (inString) {
      if (ch === stringChar) {
        if (stmt[i + 1] === stringChar) {
          i++; // skip escaped quote
        } else {
          inString = false;
        }
      }
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === "(") parenDepth++;
    if (ch === ")") parenDepth--;

    if (parenDepth < 0) {
      const { line, column } = getLineCol(fullSql, offset + i);
      errors.push({
        message: "Unexpected closing parenthesis",
        position: offset + i,
        line,
        column,
      });
      break;
    }
  }

  if (parenDepth > 0) {
    errors.push({
      message: `Unmatched opening parenthesis (${parenDepth} unclosed)`,
      position: offset,
    });
  }

  // Check unclosed string literals
  if (inString) {
    errors.push({
      message: `Unclosed string literal (${stringChar})`,
      position: offset,
    });
  }

  // Statement-specific validation
  if (type === "SELECT") {
    if (!upper.includes("FROM") && !upper.includes("(")) {
      // SELECT without FROM is valid (e.g., SELECT 1), but warn
      if (/SELECT\s+\*/.test(upper)) {
        warnings.push({
          message: "SELECT * without FROM clause",
          position: offset,
        });
      }
    }
  }

  if (type === "INSERT") {
    if (
      !upper.includes("VALUES") &&
      !upper.includes("SELECT") &&
      !upper.includes("DEFAULT VALUES")
    ) {
      errors.push({
        message: "INSERT statement missing VALUES or SELECT clause",
        position: offset,
      });
    }
  }

  if (type === "UPDATE") {
    if (!upper.includes("SET")) {
      errors.push({
        message: "UPDATE statement missing SET clause",
        position: offset,
      });
    }
    if (!upper.includes("WHERE")) {
      warnings.push({
        message: "UPDATE without WHERE clause will affect all rows",
        position: offset,
      });
    }
  }

  if (type === "DELETE") {
    if (!upper.includes("FROM")) {
      if (dialect !== "mysql") {
        errors.push({
          message: "DELETE statement missing FROM clause",
          position: offset,
        });
      }
    }
    if (!upper.includes("WHERE")) {
      warnings.push({
        message: "DELETE without WHERE clause will remove all rows",
        position: offset,
      });
    }
  }

  return { errors, warnings, type };
}

/**
 * Global SQL validation checks.
 */
function validateGlobal(sql: string): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for unclosed multi-line comments
  let commentDepth = 0;
  for (let i = 0; i < sql.length; i++) {
    if (sql[i] === "'" || sql[i] === '"') {
      const q = sql[i];
      i++;
      while (i < sql.length && sql[i] !== q) {
        if (sql[i] === q && sql[i + 1] === q) i++;
        i++;
      }
      continue;
    }
    if (sql[i] === "/" && sql[i + 1] === "*") {
      commentDepth++;
      i++;
    } else if (sql[i] === "*" && sql[i + 1] === "/") {
      commentDepth--;
      i++;
    }
  }

  if (commentDepth > 0) {
    errors.push({
      message: "Unclosed multi-line comment",
    });
  }

  return { errors, warnings };
}

/**
 * SQL Validator tool.
 * Checks SQL syntax for common errors.
 */
export const sqlValidator = defineTool({
  meta: {
    id: "sql/validator",
    name: "SQL Validator",
    description:
      "Free online SQL validator — check SQL queries for syntax errors, missing clauses, and common issues like DELETE without WHERE instantly in your browser. No data is stored. Reports statement count, types, and warnings.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "validate", "check", "syntax", "lint"],
    examples: [
      {
        title: "Validate Query",
        description: "Check a SQL query for syntax errors and common issues",
        input:
          "SELECT name FROM users WHERE active = true; DELETE FROM orders;",
        output:
          '{\n  "valid": true,\n  "errors": [],\n  "warnings": [\n    {\n      "message": "DELETE without WHERE clause will remove all rows",\n      "position": 43\n    }\n  ],\n  "statementCount": 2,\n  "statementTypes": [\n    "SELECT",\n    "DELETE"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
