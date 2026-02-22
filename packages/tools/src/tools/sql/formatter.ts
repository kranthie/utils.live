import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("SQL query to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted SQL query"),
});

const optionsSchema = z.object({
  uppercase: z.boolean().default(true).describe("Uppercase SQL keywords"),
  indent: z
    .number()
    .min(1)
    .max(8)
    .default(2)
    .describe("Number of spaces for indentation"),
  linesBetweenStatements: z
    .number()
    .min(1)
    .max(3)
    .default(2)
    .describe("Blank lines between statements"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * SQL keywords that should appear on their own line and indent the next line.
 */
const CLAUSE_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "FULL OUTER JOIN",
  "LEFT OUTER JOIN",
  "RIGHT OUTER JOIN",
  "CROSS JOIN",
  "ON",
  "AND",
  "OR",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "UNION",
  "UNION ALL",
  "INTERSECT",
  "EXCEPT",
  "INSERT INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE FROM",
  "CREATE TABLE",
  "ALTER TABLE",
  "DROP TABLE",
  "CREATE INDEX",
  "DROP INDEX",
  "RETURNING",
  "WITH",
  "AS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
];

/**
 * All SQL keywords for uppercasing.
 */
const ALL_KEYWORDS = [
  ...CLAUSE_KEYWORDS,
  "DISTINCT",
  "ALL",
  "AS",
  "ASC",
  "DESC",
  "BETWEEN",
  "IN",
  "NOT",
  "NULL",
  "IS",
  "LIKE",
  "ILIKE",
  "EXISTS",
  "ANY",
  "SOME",
  "TRUE",
  "FALSE",
  "DEFAULT",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "UNIQUE",
  "CHECK",
  "CONSTRAINT",
  "INDEX",
  "TABLE",
  "DATABASE",
  "SCHEMA",
  "IF",
  "NOT EXISTS",
  "CASCADE",
  "RESTRICT",
  "INTO",
  "INT",
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "TINYINT",
  "FLOAT",
  "DOUBLE",
  "DECIMAL",
  "NUMERIC",
  "VARCHAR",
  "CHAR",
  "TEXT",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "SERIAL",
  "BIGSERIAL",
  "AUTO_INCREMENT",
  "NOT NULL",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "COALESCE",
  "NULLIF",
  "CAST",
  "CONVERT",
  "OVER",
  "PARTITION BY",
  "ROW_NUMBER",
  "RANK",
  "DENSE_RANK",
  "LAG",
  "LEAD",
  "FIRST_VALUE",
  "LAST_VALUE",
  "FETCH",
  "NEXT",
  "ROWS",
  "ONLY",
  "FIRST",
  "PRECEDING",
  "FOLLOWING",
  "UNBOUNDED",
  "CURRENT ROW",
];

/**
 * Tokenizes SQL input into tokens while preserving strings and comments.
 */
function tokenize(sql: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < sql.length) {
    // Skip whitespace, capture as a token boundary
    if (/\s/.test(sql[i]!)) {
      i++;
      continue;
    }

    // Single-line comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      let comment = "";
      while (i < sql.length && sql[i] !== "\n") {
        comment += sql[i];
        i++;
      }
      tokens.push(comment);
      continue;
    }

    // Multi-line comment
    if (sql[i] === "/" && sql[i + 1] === "*") {
      let comment = "/*";
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) {
        comment += sql[i];
        i++;
      }
      if (i < sql.length) {
        comment += "*/";
        i += 2;
      }
      tokens.push(comment);
      continue;
    }

    // String literal (single quotes)
    if (sql[i] === "'") {
      let str = "'";
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          str += "''";
          i += 2;
        } else if (sql[i] === "'") {
          str += "'";
          i++;
          break;
        } else {
          str += sql[i];
          i++;
        }
      }
      tokens.push(str);
      continue;
    }

    // String literal (double quotes - identifiers)
    if (sql[i] === '"') {
      let str = '"';
      i++;
      while (i < sql.length && sql[i] !== '"') {
        str += sql[i];
        i++;
      }
      if (i < sql.length) {
        str += '"';
        i++;
      }
      tokens.push(str);
      continue;
    }

    // Backtick identifiers
    if (sql[i] === "`") {
      let str = "`";
      i++;
      while (i < sql.length && sql[i] !== "`") {
        str += sql[i];
        i++;
      }
      if (i < sql.length) {
        str += "`";
        i++;
      }
      tokens.push(str);
      continue;
    }

    // Operators and punctuation
    if ("(),;*".includes(sql[i]!)) {
      tokens.push(sql[i]!);
      i++;
      continue;
    }

    // Comparison operators
    if ("<>=!".includes(sql[i]!)) {
      let op = sql[i]!;
      i++;
      if (i < sql.length && "=><".includes(sql[i]!)) {
        op += sql[i];
        i++;
      }
      tokens.push(op);
      continue;
    }

    // Dot
    if (sql[i] === ".") {
      tokens.push(".");
      i++;
      continue;
    }

    // Words and numbers
    let word = "";
    while (i < sql.length && !/[\s(),;.*<>=!"`']/.test(sql[i]!)) {
      word += sql[i];
      i++;
    }
    if (word) {
      tokens.push(word);
    }
  }

  return tokens;
}

/**
 * Checks if a sequence of tokens starting at index matches a multi-word keyword.
 */
function matchMultiWordKeyword(
  tokens: string[],
  index: number,
  uppercase: boolean
): { keyword: string; consumed: number } | null {
  const multiWordKeywords = [
    "INSERT INTO",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "CREATE INDEX",
    "DROP INDEX",
    "GROUP BY",
    "ORDER BY",
    "PARTITION BY",
    "INNER JOIN",
    "LEFT OUTER JOIN",
    "RIGHT OUTER JOIN",
    "FULL OUTER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "UNION ALL",
    "NOT NULL",
    "NOT EXISTS",
    "IS NOT",
    "IS NULL",
    "IF NOT EXISTS",
    "CURRENT ROW",
  ];

  // Try longest first
  const sorted = multiWordKeywords.sort(
    (a, b) => b.split(" ").length - a.split(" ").length
  );

  for (const kw of sorted) {
    const parts = kw.split(" ");
    let matches = true;
    for (let j = 0; j < parts.length; j++) {
      if (
        index + j >= tokens.length ||
        tokens[index + j]!.toUpperCase() !== parts[j]
      ) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return {
        keyword: uppercase ? kw : kw.toLowerCase(),
        consumed: parts.length,
      };
    }
  }

  return null;
}

/**
 * Formats SQL query with configurable style.
 */
function execute(input: Input, options?: Options): Output {
  const sql = input.input.trim();
  if (!sql) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "SQL input is empty",
    });
  }

  const uppercase = options?.uppercase ?? true;
  const indentSize = options?.indent ?? 2;
  const linesBetween = options?.linesBetweenStatements ?? 2;
  const indent = " ".repeat(indentSize);

  const tokens = tokenize(sql);
  if (tokens.length === 0) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "No SQL tokens found in input",
    });
  }

  const lines: string[] = [];
  let currentLine = "";
  let indentLevel = 0;
  let i = 0;
  let parenDepth = 0;

  const newLine = (): void => {
    if (currentLine.trim()) {
      lines.push(indent.repeat(indentLevel) + currentLine.trim());
    }
    currentLine = "";
  };

  const mainClauseKeywords = new Set([
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "ORDER BY",
    "HAVING",
    "LIMIT",
    "OFFSET",
    "UNION",
    "UNION ALL",
    "INTERSECT",
    "EXCEPT",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "CREATE INDEX",
    "DROP INDEX",
    "RETURNING",
    "WITH",
  ]);

  const subClauseKeywords = new Set([
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "FULL OUTER JOIN",
    "LEFT OUTER JOIN",
    "RIGHT OUTER JOIN",
    "CROSS JOIN",
    "JOIN",
    "ON",
    "AND",
    "OR",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
  ]);

  while (i < tokens.length) {
    const token = tokens[i]!;

    // Check for semicolon (statement separator)
    if (token === ";") {
      currentLine += ";";
      newLine();
      // Add blank lines between statements
      for (let b = 0; b < linesBetween - 1; b++) {
        lines.push("");
      }
      indentLevel = 0;
      i++;
      continue;
    }

    // Check for parenthesis
    if (token === "(") {
      currentLine += " (";
      parenDepth++;
      i++;
      continue;
    }

    if (token === ")") {
      parenDepth--;
      currentLine += ")";
      i++;
      continue;
    }

    // Comma
    if (token === ",") {
      currentLine += ",";
      if (parenDepth === 0) {
        newLine();
        indentLevel = Math.max(indentLevel, 1);
      }
      i++;
      continue;
    }

    // Check for multi-word keyword match
    const multiWord = matchMultiWordKeyword(tokens, i, uppercase);
    if (multiWord && parenDepth === 0) {
      const kw = multiWord.keyword.toUpperCase();

      if (mainClauseKeywords.has(kw)) {
        newLine();
        indentLevel = 0;
        currentLine = multiWord.keyword;
        newLine();
        indentLevel = 1;
      } else if (subClauseKeywords.has(kw)) {
        newLine();
        currentLine = multiWord.keyword;
      } else {
        currentLine += (currentLine ? " " : "") + multiWord.keyword;
      }

      i += multiWord.consumed;
      continue;
    }

    // Check for single keyword
    const upperToken = token.toUpperCase();
    const singleKeywordSet = new Set(ALL_KEYWORDS.map((k) => k.toUpperCase()));
    const isKeyword = singleKeywordSet.has(upperToken);

    if (isKeyword && parenDepth === 0) {
      if (mainClauseKeywords.has(upperToken)) {
        newLine();
        indentLevel = 0;
        currentLine = uppercase ? upperToken : token.toLowerCase();
        newLine();
        indentLevel = 1;
      } else if (subClauseKeywords.has(upperToken)) {
        newLine();
        currentLine = uppercase ? upperToken : token.toLowerCase();
      } else {
        const formatted = uppercase ? upperToken : token.toLowerCase();
        currentLine += (currentLine ? " " : "") + formatted;
      }
    } else if (isKeyword) {
      // Inside parentheses, just append with keyword casing
      const formatted = uppercase ? upperToken : token.toLowerCase();
      currentLine += (currentLine ? " " : "") + formatted;
    } else {
      // Regular token
      currentLine += (currentLine ? " " : "") + token;
    }

    i++;
  }

  // Flush remaining line
  newLine();

  const output = lines.join("\n").replace(/\n{3,}/g, "\n\n");
  return { output };
}

/**
 * SQL Formatter tool.
 * Formats SQL queries with configurable style.
 */
export const sqlFormatter = defineTool({
  meta: {
    id: "sql/formatter",
    name: "SQL Formatter",
    description:
      "Free online SQL formatter — format and pretty-print SQL queries with proper indentation and keyword casing instantly in your browser. No data is stored. Supports SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, and complex JOIN queries.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "format", "beautify", "pretty", "indent"],
    examples: [
      {
        title: "Format SELECT Query",
        description:
          "Format a complex SQL query with proper indentation and keyword casing",
        input:
          "select u.name, o.total from users u inner join orders o on u.id = o.user_id where o.total > 100 order by o.total desc limit 10",
        output:
          "SELECT\n  u . name,\n  o . total\nFROM\n  users u\n  INNER JOIN orders o\n  ON u . id = o . user_id\nWHERE\n  o . total > 100\nORDER BY\n  o . total DESC\nLIMIT\n  10",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
