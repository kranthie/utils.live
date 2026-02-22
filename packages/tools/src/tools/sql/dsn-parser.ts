import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("DSN (Data Source Name) string to parse"),
});
const outputSchema = z.object({
  output: z.string().describe("Parsed DSN as JSON"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  // Try PHP-style DSN: driver:host=x;port=y;dbname=z
  const phpMatch = text.match(/^(\w+):(.+)$/);
  if (phpMatch) {
    const driver = phpMatch[1]!;
    const rest = phpMatch[2]!;
    const params: Record<string, string> = {};
    rest.split(";").forEach((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) {
        params[pair.substring(0, eqIdx).trim()] = pair
          .substring(eqIdx + 1)
          .trim();
      }
    });

    const result = {
      driver,
      host: params["host"] || params["server"] || "",
      port: params["port"] ? parseInt(params["port"], 10) : 0,
      database:
        params["dbname"] || params["database"] || params["DatabaseName"] || "",
      charset: params["charset"] || "",
      parameters: params,
      format: "php-pdo",
    };
    return { output: JSON.stringify(result, null, 2) };
  }

  // Try ODBC-style DSN: Driver={x};Server=y;Database=z;...
  if (
    text.includes("=") &&
    (text.toLowerCase().includes("driver=") ||
      text.toLowerCase().includes("dsn="))
  ) {
    const params: Record<string, string> = {};
    text.split(";").forEach((pair) => {
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) {
        params[pair.substring(0, eqIdx).trim().toLowerCase()] = pair
          .substring(eqIdx + 1)
          .trim()
          .replace(/^\{|\}$/g, "");
      }
    });

    const result = {
      driver: params["driver"] || params["dsn"] || "",
      host: params["server"] || params["host"] || params["data source"] || "",
      port: params["port"] ? parseInt(params["port"], 10) : 0,
      database:
        params["database"] ||
        params["initial catalog"] ||
        params["dbname"] ||
        "",
      username: params["uid"] || params["user id"] || params["user"] || "",
      password: params["pwd"] || params["password"] || "",
      parameters: params,
      format: "odbc",
    };
    return { output: JSON.stringify(result, null, 2) };
  }

  // Try JDBC-style: jdbc:driver://host:port/database
  const jdbcMatch = text.match(
    /^jdbc:(\w+):\/\/([^/:]+)(?::(\d+))?\/?([^?]*)?(?:\?(.*))?$/
  );
  if (jdbcMatch) {
    const params: Record<string, string> = {};
    if (jdbcMatch[5]) {
      jdbcMatch[5].split("&").forEach((p) => {
        const [k, v] = p.split("=");
        if (k) params[k] = v ?? "";
      });
    }
    const result = {
      driver: jdbcMatch[1]!,
      host: jdbcMatch[2]!,
      port: jdbcMatch[3] ? parseInt(jdbcMatch[3], 10) : 0,
      database: jdbcMatch[4] || "",
      parameters: params,
      format: "jdbc",
    };
    return { output: JSON.stringify(result, null, 2) };
  }

  throw new Error(
    "Unrecognized DSN format. Supported: PHP PDO (driver:key=val;...), ODBC (Driver={x};...), JDBC (jdbc:driver://...)"
  );
}

export const dsnParser = defineTool({
  meta: {
    id: "sql/dsn-parser",
    name: "DSN Parser",
    description:
      "Free online DSN parser — parse PHP PDO, JDBC, ODBC, and ADO.NET data source name strings into structured components instantly in your browser. No data is stored. Extracts driver, host, port, database, and connection parameters.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "dsn",
      "parse",
      "data source",
      "database",
      "connection",
      "odbc",
      "jdbc",
      "pdo",
    ],
    examples: [
      {
        title: "PHP PDO DSN",
        description: "Parse a PHP PDO-style data source name string",
        input: "mysql:host=localhost;port=3306;dbname=myapp;charset=utf8mb4",
        output:
          '{\n  "driver": "mysql",\n  "host": "localhost",\n  "port": 3306,\n  "database": "myapp",\n  "charset": "utf8mb4",\n  "parameters": {\n    "host": "localhost",\n    "port": "3306",\n    "dbname": "myapp",\n    "charset": "utf8mb4"\n  },\n  "format": "php-pdo"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
