import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SQL query to convert"),
});
const optionsSchema = z.object({
  from: z
    .enum(["mysql", "postgresql", "sqlite"])
    .default("mysql")
    .describe("Source dialect"),
  to: z
    .enum(["mysql", "postgresql", "sqlite"])
    .default("postgresql")
    .describe("Target dialect"),
});
const outputSchema = z.object({ output: z.string().describe("Converted SQL") });

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const from = options?.from ?? "mysql";
  const to = options?.to ?? "postgresql";
  if (from === to) return { output: text };

  let sql = text;

  // MySQL -> PostgreSQL
  if (from === "mysql" && to === "postgresql") {
    sql = sql.replace(/`/g, '"');
    sql = sql.replace(/\bAUTO_INCREMENT\b/gi, "GENERATED ALWAYS AS IDENTITY");
    sql = sql.replace(/\bTINYINT\s*\(1\)/gi, "BOOLEAN");
    sql = sql.replace(/\bTINYINT\b/gi, "SMALLINT");
    sql = sql.replace(/\bDATETIME\b/gi, "TIMESTAMP");
    sql = sql.replace(/\bDOUBLE\b/gi, "DOUBLE PRECISION");
    sql = sql.replace(/\bMEDIUMTEXT\b/gi, "TEXT");
    sql = sql.replace(/\bLONGTEXT\b/gi, "TEXT");
    sql = sql.replace(/\bMEDIUMBLOB\b/gi, "BYTEA");
    sql = sql.replace(/\bLONGBLOB\b/gi, "BYTEA");
    sql = sql.replace(/\bBLOB\b/gi, "BYTEA");
    sql = sql.replace(/\bENGINE\s*=\s*\w+/gi, "");
    sql = sql.replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, "");
    sql = sql.replace(/\bCOLLATE\s*=?\s*\w+/gi, "");
    sql = sql.replace(/\bUNSIGNED\b/gi, "");
    sql = sql.replace(/\bIF\s+NOT\s+EXISTS\b/gi, "IF NOT EXISTS");
    sql = sql.replace(/\bLIMIT\s+(\d+)\s*,\s*(\d+)/gi, "LIMIT $2 OFFSET $1");
    sql = sql.replace(/\bGROUP_CONCAT\(/gi, "STRING_AGG(");
    sql = sql.replace(/\bIFNULL\(/gi, "COALESCE(");
    sql = sql.replace(/\bNOW\(\)/gi, "NOW()");
  }

  // PostgreSQL -> MySQL
  if (from === "postgresql" && to === "mysql") {
    sql = sql.replace(/"/g, "`");
    sql = sql.replace(/\bGENERATED ALWAYS AS IDENTITY\b/gi, "AUTO_INCREMENT");
    sql = sql.replace(/\bSERIAL\b/gi, "INT AUTO_INCREMENT");
    sql = sql.replace(/\bBIGSERIAL\b/gi, "BIGINT AUTO_INCREMENT");
    sql = sql.replace(/\bTIMESTAMPTZ\b/gi, "DATETIME");
    sql = sql.replace(/\bTIMESTAMP\b/gi, "DATETIME");
    sql = sql.replace(/\bBYTEA\b/gi, "BLOB");
    sql = sql.replace(/\bDOUBLE PRECISION\b/gi, "DOUBLE");
    sql = sql.replace(/\bBOOLEAN\b/gi, "TINYINT(1)");
    sql = sql.replace(/\bSTRING_AGG\(/gi, "GROUP_CONCAT(");
    sql = sql.replace(/\bCOALESCE\(/gi, "IFNULL(");
    sql = sql.replace(/\bLIMIT\s+(\d+)\s+OFFSET\s+(\d+)/gi, "LIMIT $2, $1");
    sql = sql.replace(/::\w+/g, ""); // Remove type casts
  }

  // To SQLite
  if (to === "sqlite") {
    sql = sql.replace(/`|"/g, '"');
    sql = sql.replace(/\bAUTO_INCREMENT\b/gi, "AUTOINCREMENT");
    sql = sql.replace(/\bSERIAL\b/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
    sql = sql.replace(/\bGENERATED ALWAYS AS IDENTITY\b/gi, "AUTOINCREMENT");
    sql = sql.replace(/\bBOOLEAN\b/gi, "INTEGER");
    sql = sql.replace(/\bTINYINT\s*(\(\d+\))?/gi, "INTEGER");
    sql = sql.replace(/\bBIGINT\b/gi, "INTEGER");
    sql = sql.replace(/\bDOUBLE\s*PRECISION\b/gi, "REAL");
    sql = sql.replace(/\bFLOAT\b/gi, "REAL");
    sql = sql.replace(/\bDATETIME\b/gi, "TEXT");
    sql = sql.replace(/\bTIMESTAMP(TZ)?\b/gi, "TEXT");
    sql = sql.replace(/\bBYTEA\b/gi, "BLOB");
    sql = sql.replace(/\bVARCHAR\s*\(\d+\)/gi, "TEXT");
    sql = sql.replace(/\bENGINE\s*=\s*\w+/gi, "");
    sql = sql.replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, "");
  }

  // Add conversion comment
  const header = `-- Converted from ${from.toUpperCase()} to ${to.toUpperCase()}\n-- Please review for accuracy\n\n`;
  return { output: header + sql };
}

export const sqlDialectConverter = defineTool({
  meta: {
    id: "sql/sql-dialect-converter",
    name: "SQL Dialect Converter",
    description:
      "Free online SQL dialect converter — convert SQL between MySQL, PostgreSQL, and SQLite syntax instantly in your browser. No data is stored. Handles AUTO_INCREMENT vs SERIAL, TINYINT vs BOOLEAN, engine clauses, and quoting differences.",
    category: "sql",
    subgroup: "SQL Core",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "convert",
      "mysql",
      "postgresql",
      "sqlite",
      "dialect",
      "migrate",
    ],
    ui: { inputLanguage: "sql", outputLanguage: "sql" },
    examples: [
      {
        title: "MySQL to PostgreSQL",
        description:
          "Convert a MySQL CREATE TABLE statement to PostgreSQL syntax",
        input:
          "CREATE TABLE users (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  name VARCHAR(100),\n  active TINYINT(1) DEFAULT 1\n) ENGINE=InnoDB;",
        output:
          "-- Converted from MYSQL to POSTGRESQL\n-- Please review for accuracy\n\nCREATE TABLE users (\n  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  name VARCHAR(100),\n  active BOOLEAN DEFAULT 1\n) ;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
