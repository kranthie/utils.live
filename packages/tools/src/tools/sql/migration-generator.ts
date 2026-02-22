import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const addColumnSchema = z.object({
  action: z.literal("add_column"),
  table: z.string(),
  column: z.string(),
  type: z.string(),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
});

const dropColumnSchema = z.object({
  action: z.literal("drop_column"),
  table: z.string(),
  column: z.string(),
});

const renameColumnSchema = z.object({
  action: z.literal("rename_column"),
  table: z.string(),
  oldName: z.string(),
  newName: z.string(),
});

const modifyColumnSchema = z.object({
  action: z.literal("modify_column"),
  table: z.string(),
  column: z.string(),
  newType: z.string().optional(),
  nullable: z.boolean().optional(),
  defaultValue: z.string().optional(),
});

const createTableSchema = z.object({
  action: z.literal("create_table"),
  table: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      nullable: z.boolean().default(true),
      primaryKey: z.boolean().default(false),
      defaultValue: z.string().optional(),
    })
  ),
});

const dropTableSchema = z.object({
  action: z.literal("drop_table"),
  table: z.string(),
});

const renameTableSchema = z.object({
  action: z.literal("rename_table"),
  oldName: z.string(),
  newName: z.string(),
});

const addIndexSchema = z.object({
  action: z.literal("add_index"),
  table: z.string(),
  name: z.string(),
  columns: z.array(z.string()),
  unique: z.boolean().default(false),
});

const dropIndexSchema = z.object({
  action: z.literal("drop_index"),
  name: z.string(),
});

const addForeignKeySchema = z.object({
  action: z.literal("add_foreign_key"),
  table: z.string(),
  column: z.string(),
  referencesTable: z.string(),
  referencesColumn: z.string(),
  onDelete: z
    .enum(["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"])
    .default("NO ACTION"),
  constraintName: z.string().optional(),
});

const migrationActionSchema = z.discriminatedUnion("action", [
  addColumnSchema,
  dropColumnSchema,
  renameColumnSchema,
  modifyColumnSchema,
  createTableSchema,
  dropTableSchema,
  renameTableSchema,
  addIndexSchema,
  dropIndexSchema,
  addForeignKeySchema,
]);

const inputSchema = z.object({
  name: z.string().describe("Migration name/description"),
  actions: z.array(migrationActionSchema).min(1).describe("Migration actions"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated migration SQL"),
  upSql: z.string().describe("Forward migration SQL"),
  downSql: z.string().describe("Rollback migration SQL"),
  actionCount: z.number().describe("Number of migration actions"),
});

const optionsSchema = z.object({
  dialect: z
    .enum(["standard", "mysql", "postgresql", "sqlite"])
    .default("standard")
    .describe("SQL dialect"),
  includeTransaction: z.boolean().default(true).describe("Wrap in transaction"),
  includeTimestamp: z
    .boolean()
    .default(true)
    .describe("Include timestamp comment"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;
type MigrationAction = z.infer<typeof migrationActionSchema>;

/**
 * Generates the UP (forward) SQL for a migration action.
 */
function generateUpSql(action: MigrationAction, dialect: string): string {
  switch (action.action) {
    case "add_column": {
      let sql = `ALTER TABLE ${action.table} ADD COLUMN ${action.column} ${action.type}`;
      if (!action.nullable) sql += " NOT NULL";
      if (action.defaultValue !== undefined)
        sql += ` DEFAULT ${action.defaultValue}`;
      return sql + ";";
    }
    case "drop_column":
      return `ALTER TABLE ${action.table} DROP COLUMN ${action.column};`;
    case "rename_column":
      if (dialect === "mysql") {
        return `ALTER TABLE ${action.table} RENAME COLUMN ${action.oldName} TO ${action.newName};`;
      }
      return `ALTER TABLE ${action.table} RENAME COLUMN ${action.oldName} TO ${action.newName};`;
    case "modify_column": {
      if (dialect === "mysql") {
        const parts = [
          `ALTER TABLE ${action.table} MODIFY COLUMN ${action.column}`,
        ];
        if (action.newType) parts.push(action.newType);
        if (action.nullable === false) parts.push("NOT NULL");
        if (action.defaultValue !== undefined)
          parts.push(`DEFAULT ${action.defaultValue}`);
        return parts.join(" ") + ";";
      }
      // PostgreSQL uses ALTER COLUMN
      const stmts: string[] = [];
      if (action.newType) {
        stmts.push(
          `ALTER TABLE ${action.table} ALTER COLUMN ${action.column} TYPE ${action.newType};`
        );
      }
      if (action.nullable !== undefined) {
        if (action.nullable) {
          stmts.push(
            `ALTER TABLE ${action.table} ALTER COLUMN ${action.column} DROP NOT NULL;`
          );
        } else {
          stmts.push(
            `ALTER TABLE ${action.table} ALTER COLUMN ${action.column} SET NOT NULL;`
          );
        }
      }
      if (action.defaultValue !== undefined) {
        stmts.push(
          `ALTER TABLE ${action.table} ALTER COLUMN ${action.column} SET DEFAULT ${action.defaultValue};`
        );
      }
      return stmts.join("\n");
    }
    case "create_table": {
      const colDefs = action.columns.map((col) => {
        let def = `  ${col.name} ${col.type}`;
        if (col.primaryKey) def += " PRIMARY KEY";
        if (!col.nullable && !col.primaryKey) def += " NOT NULL";
        if (col.defaultValue !== undefined)
          def += ` DEFAULT ${col.defaultValue}`;
        return def;
      });
      return `CREATE TABLE ${action.table} (\n${colDefs.join(",\n")}\n);`;
    }
    case "drop_table":
      return `DROP TABLE ${action.table};`;
    case "rename_table":
      if (dialect === "mysql") {
        return `RENAME TABLE ${action.oldName} TO ${action.newName};`;
      }
      return `ALTER TABLE ${action.oldName} RENAME TO ${action.newName};`;
    case "add_index": {
      const uniqueStr = action.unique ? "UNIQUE " : "";
      return `CREATE ${uniqueStr}INDEX ${action.name} ON ${action.table} (${action.columns.join(", ")});`;
    }
    case "drop_index":
      return `DROP INDEX ${action.name};`;
    case "add_foreign_key": {
      const constraintName =
        action.constraintName ?? `fk_${action.table}_${action.column}`;
      return `ALTER TABLE ${action.table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${action.column}) REFERENCES ${action.referencesTable}(${action.referencesColumn}) ON DELETE ${action.onDelete};`;
    }
    default:
      return "-- Unknown action";
  }
}

/**
 * Generates the DOWN (rollback) SQL for a migration action.
 */
function generateDownSql(action: MigrationAction, dialect: string): string {
  switch (action.action) {
    case "add_column":
      return `ALTER TABLE ${action.table} DROP COLUMN ${action.column};`;
    case "drop_column":
      return `-- Cannot automatically reverse DROP COLUMN for ${action.table}.${action.column}\n-- ALTER TABLE ${action.table} ADD COLUMN ${action.column} <type>;`;
    case "rename_column":
      return `ALTER TABLE ${action.table} RENAME COLUMN ${action.newName} TO ${action.oldName};`;
    case "modify_column":
      return `-- Cannot automatically reverse MODIFY COLUMN for ${action.table}.${action.column}\n-- Manual reversal required`;
    case "create_table":
      return `DROP TABLE IF EXISTS ${action.table};`;
    case "drop_table":
      return `-- Cannot automatically reverse DROP TABLE ${action.table}\n-- Manual recreation required`;
    case "rename_table":
      if (dialect === "mysql") {
        return `RENAME TABLE ${action.newName} TO ${action.oldName};`;
      }
      return `ALTER TABLE ${action.newName} RENAME TO ${action.oldName};`;
    case "add_index":
      return `DROP INDEX ${action.name};`;
    case "drop_index":
      return `-- Cannot automatically reverse DROP INDEX ${action.name}\n-- Manual recreation required`;
    case "add_foreign_key": {
      const constraintName =
        action.constraintName ?? `fk_${action.table}_${action.column}`;
      return `ALTER TABLE ${action.table} DROP CONSTRAINT ${constraintName};`;
    }
    default:
      return "-- Unknown action";
  }
}

/**
 * Generates migration SQL from a list of actions.
 */
function execute(input: Input, options?: Options): Output {
  const { name, actions } = input;
  const dialect = options?.dialect ?? "standard";
  const includeTransaction = options?.includeTransaction ?? true;
  const includeTimestamp = options?.includeTimestamp ?? true;

  if (!name.trim()) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Migration name cannot be empty",
    });
  }

  const upStatements = actions.map((a) => generateUpSql(a, dialect));
  const downStatements = actions
    .slice()
    .reverse()
    .map((a) => generateDownSql(a, dialect));

  const header = includeTimestamp
    ? `-- Migration: ${name}\n-- Generated: ${new Date().toISOString()}\n\n`
    : `-- Migration: ${name}\n\n`;

  let upSql: string;
  let downSql: string;

  if (includeTransaction) {
    upSql = `${header}-- Up Migration\nBEGIN;\n\n${upStatements.join("\n\n")}\n\nCOMMIT;`;
    downSql = `-- Down Migration (Rollback)\nBEGIN;\n\n${downStatements.join("\n\n")}\n\nCOMMIT;`;
  } else {
    upSql = `${header}-- Up Migration\n${upStatements.join("\n\n")}`;
    downSql = `-- Down Migration (Rollback)\n${downStatements.join("\n\n")}`;
  }

  const output = `${upSql}\n\n${downSql}`;

  return {
    output,
    upSql,
    downSql,
    actionCount: actions.length,
  };
}

/**
 * Migration Generator tool.
 * Generates database migration SQL scripts from structured actions.
 */
export const sqlMigrationGenerator = defineTool({
  meta: {
    id: "sql/migration-generator",
    name: "Migration Generator",
    description:
      "Free online SQL migration generator — create database migration scripts with up and down operations from structured actions instantly in your browser. No data is stored. Supports add/drop column, create/drop table, add/drop index, and rename operations.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "migration",
      "generate",
      "alter",
      "schema",
      "database",
      "rollback",
    ],
    examples: [
      {
        title: "Add Email Column Migration",
        description:
          "Generate a migration to add an email column to the users table",
        input: {
          name: "add_email_to_users",
          actions: [
            {
              action: "add_column",
              table: "users",
              column: "email",
              type: "VARCHAR(255)",
              nullable: false,
            },
          ],
        },
        output:
          "-- Migration: add_email_to_users\n\n-- Up Migration\nBEGIN;\n\nALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;\n\nCOMMIT;\n\n-- Down Migration (Rollback)\nBEGIN;\n\nALTER TABLE users DROP COLUMN email;\n\nCOMMIT;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
