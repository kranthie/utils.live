import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Database connection URL to convert"),
});
const optionsSchema = z.object({
  targetFormat: z
    .enum([
      "env",
      "json",
      "yaml",
      "prisma",
      "sequelize",
      "typeorm",
      "knex",
      "django",
      "laravel",
      "spring",
    ])
    .default("env")
    .describe("Target configuration format"),
});
const outputSchema = z.object({
  output: z.string().describe("Converted configuration"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const targetFormat = options?.targetFormat ?? "env";

  // Parse the URL
  const match = text.match(
    /^(\w+(?:\+\w+)?):\/\/(?:([^:@]+)(?::([^@]*))?@)?([^/:?]+)(?::(\d+))?\/?([^?]*)?(?:\?(.*))?$/
  );
  if (!match)
    throw new Error(
      "Invalid database URL format. Expected: scheme://user:pass@host:port/database"
    );

  const scheme = match[1]!.split("+")[0]!;
  const username = match[2] ? decodeURIComponent(match[2]) : "";
  const password = match[3] ? decodeURIComponent(match[3]) : "";
  const host = match[4]!;
  const port = match[5] ? parseInt(match[5], 10) : getDefaultPort(scheme);
  const database = match[6] ? decodeURIComponent(match[6]) : "";
  const params: Record<string, string> = {};
  if (match[7])
    match[7].split("&").forEach((p) => {
      const [k, v] = p.split("=");
      if (k) params[k] = v ?? "";
    });

  const ssl = params.sslmode === "require" || params.ssl === "true";

  switch (targetFormat) {
    case "env":
      return {
        output: [
          `DATABASE_URL=${text}`,
          `DB_HOST=${host}`,
          `DB_PORT=${port}`,
          `DB_NAME=${database}`,
          `DB_USER=${username}`,
          `DB_PASSWORD=${password}`,
          ssl ? "DB_SSL=true" : "",
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "json":
      return {
        output: JSON.stringify(
          { host, port, database, username, password, ssl, dialect: scheme },
          null,
          2
        ),
      };

    case "yaml":
      return {
        output: [
          `database:`,
          `  host: ${host}`,
          `  port: ${port}`,
          `  name: ${database}`,
          `  username: ${username}`,
          `  password: ${password}`,
          `  ssl: ${ssl}`,
        ].join("\n"),
      };

    case "prisma":
      return {
        output: `datasource db {\n  provider = "${mapToPrismaProvider(scheme)}"\n  url      = env("DATABASE_URL")\n}\n\n# .env\n# DATABASE_URL="${text}"`,
      };

    case "sequelize":
      return {
        output: `module.exports = {\n  dialect: '${mapToSequelizeDialect(scheme)}',\n  host: '${host}',\n  port: ${port},\n  database: '${database}',\n  username: '${username}',\n  password: '${password}',\n  dialectOptions: {\n    ssl: ${ssl ? "{ require: true, rejectUnauthorized: false }" : "false"},\n  },\n};`,
      };

    case "typeorm":
      return {
        output: `{\n  "type": "${mapToTypeOrmType(scheme)}",\n  "host": "${host}",\n  "port": ${port},\n  "database": "${database}",\n  "username": "${username}",\n  "password": "${password}",\n  "ssl": ${ssl},\n  "synchronize": false,\n  "logging": false\n}`,
      };

    case "knex":
      return {
        output: `module.exports = {\n  client: '${mapToKnexClient(scheme)}',\n  connection: {\n    host: '${host}',\n    port: ${port},\n    database: '${database}',\n    user: '${username}',\n    password: '${password}',\n    ssl: ${ssl ? "{ rejectUnauthorized: false }" : "false"},\n  },\n  pool: { min: 2, max: 10 },\n};`,
      };

    case "django":
      return {
        output: `DATABASES = {\n    'default': {\n        'ENGINE': '${mapToDjangoEngine(scheme)}',\n        'NAME': '${database}',\n        'USER': '${username}',\n        'PASSWORD': '${password}',\n        'HOST': '${host}',\n        'PORT': '${port}',\n    }\n}`,
      };

    case "laravel":
      return {
        output: [
          `DB_CONNECTION=${mapToLaravelDriver(scheme)}`,
          `DB_HOST=${host}`,
          `DB_PORT=${port}`,
          `DB_DATABASE=${database}`,
          `DB_USERNAME=${username}`,
          `DB_PASSWORD=${password}`,
        ].join("\n"),
      };

    case "spring":
      return {
        output: [
          `spring.datasource.url=jdbc:${mapToJdbcScheme(scheme)}://${host}:${port}/${database}`,
          `spring.datasource.username=${username}`,
          `spring.datasource.password=${password}`,
          `spring.datasource.driver-class-name=${mapToJdbcDriver(scheme)}`,
        ].join("\n"),
      };
  }

  return { output: text };
}

function getDefaultPort(s: string): number {
  const m: Record<string, number> = {
    postgresql: 5432,
    postgres: 5432,
    mysql: 3306,
    mongodb: 27017,
    redis: 6379,
    mssql: 1433,
  };
  return m[s] ?? 0;
}
function mapToPrismaProvider(s: string): string {
  const m: Record<string, string> = {
    postgresql: "postgresql",
    postgres: "postgresql",
    mysql: "mysql",
    sqlite: "sqlite",
    mongodb: "mongodb",
    mssql: "sqlserver",
  };
  return m[s] ?? s;
}
function mapToSequelizeDialect(s: string): string {
  const m: Record<string, string> = {
    postgresql: "postgres",
    postgres: "postgres",
    mysql: "mysql",
    sqlite: "sqlite",
    mssql: "mssql",
  };
  return m[s] ?? s;
}
function mapToTypeOrmType(s: string): string {
  const m: Record<string, string> = {
    postgresql: "postgres",
    postgres: "postgres",
    mysql: "mysql",
    sqlite: "sqlite",
    mssql: "mssql",
    mongodb: "mongodb",
  };
  return m[s] ?? s;
}
function mapToKnexClient(s: string): string {
  const m: Record<string, string> = {
    postgresql: "pg",
    postgres: "pg",
    mysql: "mysql2",
    sqlite: "better-sqlite3",
    mssql: "mssql",
  };
  return m[s] ?? s;
}
function mapToDjangoEngine(s: string): string {
  const m: Record<string, string> = {
    postgresql: "django.db.backends.postgresql",
    postgres: "django.db.backends.postgresql",
    mysql: "django.db.backends.mysql",
    sqlite: "django.db.backends.sqlite3",
  };
  return m[s] ?? `django.db.backends.${s}`;
}
function mapToLaravelDriver(s: string): string {
  const m: Record<string, string> = {
    postgresql: "pgsql",
    postgres: "pgsql",
    mysql: "mysql",
    sqlite: "sqlite",
    mssql: "sqlsrv",
  };
  return m[s] ?? s;
}
function mapToJdbcScheme(s: string): string {
  const m: Record<string, string> = {
    postgresql: "postgresql",
    postgres: "postgresql",
    mysql: "mysql",
    mssql: "sqlserver",
  };
  return m[s] ?? s;
}
function mapToJdbcDriver(s: string): string {
  const m: Record<string, string> = {
    postgresql: "org.postgresql.Driver",
    postgres: "org.postgresql.Driver",
    mysql: "com.mysql.cj.jdbc.Driver",
    mssql: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
  };
  return m[s] ?? "";
}

export const databaseUrlConverter = defineTool({
  meta: {
    id: "sql/database-url-converter",
    name: "Database URL Converter",
    description:
      "Free online database URL converter — transform database connection URLs into env, JSON, YAML, Prisma, Sequelize, TypeORM, Knex, Django, Laravel, and Spring configuration formats instantly in your browser. No data is stored.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "database",
      "url",
      "convert",
      "prisma",
      "typeorm",
      "sequelize",
      "knex",
      "django",
    ],
    examples: [
      {
        title: "PostgreSQL to Prisma",
        description:
          "Convert a PostgreSQL connection URL to Prisma configuration format",
        input: "postgresql://admin:secret@localhost:5432/myapp",
        output:
          "DATABASE_URL=postgresql://admin:secret@localhost:5432/myapp\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=myapp\nDB_USER=admin\nDB_PASSWORD=secret",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
