import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  driver: z
    .enum(["postgresql", "mysql", "mongodb", "redis", "sqlite", "mssql"])
    .default("postgresql")
    .describe("Database driver"),
  host: z.string().default("localhost").describe("Database host"),
  port: z.number().optional().describe("Port number (uses default if omitted)"),
  database: z.string().default("mydb").describe("Database name"),
  username: z.string().default("").describe("Username"),
  password: z.string().default("").describe("Password"),
  ssl: z.boolean().default(false).describe("Enable SSL"),
  options: z
    .string()
    .default("")
    .describe("Additional options (key=value pairs separated by &)"),
  format: z
    .enum(["uri", "key-value", "env"])
    .default("uri")
    .describe("Output format"),
});
const outputSchema = z.object({
  output: z.string().describe("Connection string"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const driver = input.driver;
  const host = input.host || "localhost";
  const port = input.port ?? getDefaultPort(driver);
  const db = input.database || "mydb";
  const user = input.username;
  const pass = input.password;
  const ssl = input.ssl;

  const extraParams: string[] = [];
  if (input.options) {
    input.options.split("&").forEach((o) => {
      if (o.trim()) extraParams.push(o.trim());
    });
  }
  if (ssl) {
    if (driver === "postgresql") extraParams.push("sslmode=require");
    else if (driver === "mysql") extraParams.push("ssl=true");
    else if (driver === "mongodb") extraParams.push("ssl=true");
    else if (driver === "redis") {
      /* use rediss:// scheme instead */
    } else if (driver === "mssql") extraParams.push("encrypt=true");
  }

  if (input.format === "uri") {
    const scheme = getScheme(driver, ssl);
    const auth = user
      ? pass
        ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`
        : `${encodeURIComponent(user)}@`
      : "";
    const portStr = port !== getDefaultPort(driver) ? `:${port}` : "";
    const paramStr = extraParams.length > 0 ? `?${extraParams.join("&")}` : "";
    if (driver === "sqlite") return { output: `sqlite:///${db}` };
    return { output: `${scheme}://${auth}${host}${portStr}/${db}${paramStr}` };
  }

  if (input.format === "key-value") {
    const parts: string[] = [];
    if (driver === "mssql") {
      parts.push(`Server=${host},${port}`);
      parts.push(`Database=${db}`);
      if (user) parts.push(`User Id=${user}`);
      if (pass) parts.push(`Password=${pass}`);
      if (ssl) parts.push("Encrypt=true");
    } else {
      parts.push(`Host=${host}`);
      parts.push(`Port=${port}`);
      parts.push(`Database=${db}`);
      if (user) parts.push(`User=${user}`);
      if (pass) parts.push(`Password=${pass}`);
    }
    return { output: parts.join("; ") + ";" };
  }

  if (input.format === "env") {
    const prefix = driver
      .toUpperCase()
      .replace("POSTGRESQL", "DB")
      .replace("MYSQL", "DB")
      .replace("MSSQL", "DB");
    const lines = [
      `${prefix}_HOST=${host}`,
      `${prefix}_PORT=${port}`,
      `${prefix}_NAME=${db}`,
      `${prefix}_USER=${user}`,
      `${prefix}_PASSWORD=${pass}`,
    ];
    if (ssl) lines.push(`${prefix}_SSL=true`);
    // Also include full URL
    const scheme = getScheme(driver, ssl);
    const auth = user ? (pass ? `${user}:${pass}@` : `${user}@`) : "";
    lines.push(`DATABASE_URL=${scheme}://${auth}${host}:${port}/${db}`);
    return { output: lines.join("\n") };
  }

  return { output: "" };
}

function getScheme(driver: string, ssl: boolean): string {
  const map: Record<string, string> = {
    postgresql: "postgresql",
    mysql: "mysql",
    mongodb: "mongodb",
    redis: ssl ? "rediss" : "redis",
    sqlite: "sqlite",
    mssql: "mssql",
  };
  return map[driver] ?? driver;
}

function getDefaultPort(driver: string): number {
  const map: Record<string, number> = {
    postgresql: 5432,
    mysql: 3306,
    mongodb: 27017,
    redis: 6379,
    sqlite: 0,
    mssql: 1433,
  };
  return map[driver] ?? 0;
}

export const connectionStringBuilder = defineTool({
  meta: {
    id: "sql/connection-string-builder",
    name: "Connection String Builder",
    description:
      "Free online database connection string builder — generate PostgreSQL, MySQL, MongoDB, Redis, SQLite, and MSSQL connection URIs from parameters instantly in your browser. No data is stored. Supports URI, key-value, and environment variable output formats.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "connection",
      "string",
      "builder",
      "database",
      "uri",
      "dsn",
    ],
    ui: { outputLanguage: "plaintext" },
    examples: [
      {
        title: "PostgreSQL Connection URI",
        description:
          "Build a PostgreSQL connection URI with credentials and SSL",
        input: {
          driver: "postgresql",
          host: "db.example.com",
          port: 5432,
          database: "myapp",
          username: "admin",
          password: "secret",
          ssl: true,
        },
        output:
          "postgresql://admin:secret@db.example.com/myapp?sslmode=require",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
