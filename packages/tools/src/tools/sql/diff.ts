import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input1: z.string().describe("First SQL query"),
  input2: z.string().describe("Second SQL query"),
});

const outputSchema = z.object({
  identical: z.boolean().describe("Whether the queries are identical"),
  original: z.string().describe("First query (normalized)"),
  modified: z.string().describe("Second query (normalized)"),
  differences: z
    .array(
      z.object({
        type: z.enum(["added", "removed", "modified"]),
        section: z.string().describe("SQL section (e.g., SELECT, WHERE)"),
        detail: z.string().describe("Description of the difference"),
      })
    )
    .describe("List of differences found"),
  structuralDiff: z.object({
    clausesAdded: z.array(z.string()),
    clausesRemoved: z.array(z.string()),
    clausesModified: z.array(z.string()),
  }),
});

const optionsSchema = z.object({
  ignoreCase: z
    .boolean()
    .default(true)
    .describe("Ignore keyword casing differences"),
  ignoreWhitespace: z
    .boolean()
    .default(true)
    .describe("Ignore whitespace differences"),
  ignoreComments: z
    .boolean()
    .default(true)
    .describe("Ignore comments in comparison"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface DiffEntry {
  type: "added" | "removed" | "modified";
  section: string;
  detail: string;
}

/**
 * Normalizes SQL for comparison by removing comments and normalizing whitespace.
 */
function normalizeSql(
  sql: string,
  ignoreCase: boolean,
  ignoreWhitespace: boolean,
  ignoreComments: boolean
): string {
  let result = sql;

  if (ignoreComments) {
    // Remove single-line comments
    result = result.replace(/--[^\n]*/g, "");
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  if (ignoreWhitespace) {
    // Normalize whitespace to single spaces
    result = result.replace(/\s+/g, " ").trim();
  }

  if (ignoreCase) {
    result = result.toUpperCase();
  }

  return result;
}

/**
 * Extracts SQL clauses from a normalized query for structural comparison.
 */
function extractClauses(sql: string): Map<string, string> {
  const clauses = new Map<string, string>();
  const upper = sql.toUpperCase();

  const clauseKeywords = [
    "WITH",
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "INSERT INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "RETURNING",
    "UNION",
    "UNION ALL",
    "INTERSECT",
    "EXCEPT",
  ];

  // Sort by length descending so longer keywords match first
  const sorted = [...clauseKeywords].sort((a, b) => b.length - a.length);

  // Find positions of each clause
  const positions: Array<{
    keyword: string;
    start: number;
    keywordLen: number;
  }> = [];

  for (const kw of sorted) {
    let searchFrom = 0;
    while (searchFrom < upper.length) {
      const idx = upper.indexOf(kw, searchFrom);
      if (idx === -1) break;

      // Ensure it's a word boundary
      const before = idx > 0 ? upper[idx - 1] : " ";
      const after =
        idx + kw.length < upper.length ? upper[idx + kw.length] : " ";

      if (/[\s(;]/.test(before!) && /[\s(;]/.test(after!)) {
        // Check it's not inside an already-found clause
        const alreadyCovered = positions.some(
          (p) => idx >= p.start && idx < p.start + p.keywordLen
        );
        if (!alreadyCovered) {
          positions.push({ keyword: kw, start: idx, keywordLen: kw.length });
        }
      }

      searchFrom = idx + 1;
    }
  }

  // Sort positions by start
  positions.sort((a, b) => a.start - b.start);

  // Extract clause bodies
  for (let i = 0; i < positions.length; i++) {
    const current = positions[i]!;
    const bodyStart = current.start + current.keywordLen;
    const bodyEnd =
      i + 1 < positions.length ? positions[i + 1]!.start : sql.length;
    const body = sql.substring(bodyStart, bodyEnd).trim();
    clauses.set(current.keyword, body);
  }

  // If no clauses found, store the whole thing
  if (clauses.size === 0) {
    clauses.set("STATEMENT", sql.trim());
  }

  return clauses;
}

/**
 * Compares two SQL queries and produces a diff.
 */
function execute(input: Input, options?: Options): Output {
  const sql1 = input.input1.trim();
  const sql2 = input.input2.trim();

  if (!sql1 && !sql2) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Both SQL inputs are empty",
    });
  }

  const ignoreCase = options?.ignoreCase ?? true;
  const ignoreWhitespace = options?.ignoreWhitespace ?? true;
  const ignoreComments = options?.ignoreComments ?? true;

  const normalized1 = normalizeSql(
    sql1,
    ignoreCase,
    ignoreWhitespace,
    ignoreComments
  );
  const normalized2 = normalizeSql(
    sql2,
    ignoreCase,
    ignoreWhitespace,
    ignoreComments
  );

  const identical = normalized1 === normalized2;
  const differences: DiffEntry[] = [];

  if (!identical) {
    // Structural comparison via clause extraction
    const clauses1 = extractClauses(normalized1);
    const clauses2 = extractClauses(normalized2);

    const allKeys = new Set([...clauses1.keys(), ...clauses2.keys()]);

    for (const key of allKeys) {
      const val1 = clauses1.get(key);
      const val2 = clauses2.get(key);

      if (val1 === undefined) {
        differences.push({
          type: "added",
          section: key,
          detail: `${key} clause added: ${val2}`,
        });
      } else if (val2 === undefined) {
        differences.push({
          type: "removed",
          section: key,
          detail: `${key} clause removed: ${val1}`,
        });
      } else if (val1 !== val2) {
        differences.push({
          type: "modified",
          section: key,
          detail: `${key} changed from "${val1}" to "${val2}"`,
        });
      }
    }

    // If no structural differences found but strings differ, report as text diff
    if (differences.length === 0) {
      differences.push({
        type: "modified",
        section: "QUERY",
        detail: "Queries differ in content",
      });
    }
  }

  const clausesAdded = differences
    .filter((d) => d.type === "added")
    .map((d) => d.section);
  const clausesRemoved = differences
    .filter((d) => d.type === "removed")
    .map((d) => d.section);
  const clausesModified = differences
    .filter((d) => d.type === "modified")
    .map((d) => d.section);

  return {
    identical,
    original: normalized1,
    modified: normalized2,
    differences,
    structuralDiff: {
      clausesAdded,
      clausesRemoved,
      clausesModified,
    },
  };
}

/**
 * SQL Diff tool.
 * Compares two SQL queries and shows differences.
 */
export const sqlDiff = defineTool({
  meta: {
    id: "sql/diff",
    name: "SQL Diff",
    description:
      "Free online SQL diff tool — compare two SQL queries side by side and detect structural differences in columns, tables, joins, and clauses instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: ["sql", "diff", "compare", "difference", "query"],
    examples: [
      {
        title: "Compare SQL Queries",
        description:
          "Compare two SELECT queries to find structural differences",
        input: {
          input1: "SELECT name, email FROM users WHERE active = true",
          input2:
            "SELECT name, email, age FROM users WHERE active = true AND age > 18",
        },
        output:
          '{\n  "identical": false,\n  "original": "SELECT NAME, EMAIL FROM USERS WHERE ACTIVE = TRUE",\n  "modified": "SELECT NAME, EMAIL, AGE FROM USERS WHERE ACTIVE = TRUE AND AGE > 18",\n  "differences": [\n    {\n      "type": "modified",\n      "section": "SELECT",\n      "detail": "SELECT changed from \\"NAME, EMAIL\\" to \\"NAME, EMAIL, AGE\\""\n    },\n    {\n      "type": "modified",\n      "section": "WHERE",\n      "detail": "WHERE changed from \\"ACTIVE = TRUE\\" to \\"ACTIVE = TRUE AND AGE > 18\\""\n    }\n  ],\n  "structuralDiff": {\n    "clausesAdded": [],\n    "clausesRemoved": [],\n    "clausesModified": [\n      "SELECT",\n      "WHERE"\n    ]\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
