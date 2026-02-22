import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  sqlFormatter,
  sqlMinify,
  sqlValidator,
  sqlToJsonLegacy,
  sqlParser,
  sqlExplainer,
  sqlToNosql,
  sqlDialectConverter,
  sqlQueryBuilder,
  sqlIndexSuggester,
  jsonToSqlInsert,
  csvToSqlInsert,
  connectionStringBuilder,
  dsnParser,
  redisCommandBuilder,
  mongodbQueryBuilder,
  elasticsearchQueryBuilder,
  databaseUrlConverter,
  erDiagramGenerator,
} from "../../../src/tools/sql";

const SAMPLE_SQL =
  "SELECT id, name, email FROM users WHERE active = true ORDER BY name ASC";
const SAMPLE_SELECT = "SELECT * FROM users WHERE id = 1";

// =====================================================
// SQL Formatter (legacy)
// =====================================================
describe("SQL Formatter (legacy)", () => {
  it("should have correct metadata", () => {
    expect(sqlFormatter.meta.id).toBe("sql/formatter");
    expect(sqlFormatter.meta.category).toBe("sql");
  });

  it("should format a simple SQL query", async () => {
    const result = await executeTool(sqlFormatter, { input: SAMPLE_SQL });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SELECT"
      );
      expect((result.data as Record<string, unknown>).output).toContain("FROM");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(sqlFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// SQL Minify (legacy)
// =====================================================
describe("SQL Minify (legacy)", () => {
  it("should have correct metadata", () => {
    expect(sqlMinify.meta.id).toBe("sql/minify");
    expect(sqlMinify.meta.category).toBe("sql");
  });

  it("should minify formatted SQL", async () => {
    const formatted =
      "SELECT\n  id,\n  name\nFROM\n  users\nWHERE\n  active = true";
    const result = await executeTool(sqlMinify, { input: formatted });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        (result.data as Record<string, unknown>).output.length
      ).toBeLessThan(formatted.length);
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(sqlMinify, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// SQL Validator (legacy)
// =====================================================
describe("SQL Validator (legacy)", () => {
  it("should have correct metadata", () => {
    expect(sqlValidator.meta.id).toBe("sql/validator");
    expect(sqlValidator.meta.category).toBe("sql");
  });

  it("should validate a valid SQL query", async () => {
    const result = await executeTool(sqlValidator, { input: SAMPLE_SELECT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(true);
    }
  });

  it("should detect invalid SQL", async () => {
    const result = await executeTool(sqlValidator, { input: "SELEC FROM" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });
});

// =====================================================
// SQL to JSON (legacy)
// =====================================================
describe("SQL to JSON (legacy)", () => {
  it("should have correct metadata", () => {
    expect(sqlToJsonLegacy.meta.id).toBe("sql/to-json");
    expect(sqlToJsonLegacy.meta.category).toBe("sql");
  });

  it("should parse SQL to AST JSON", async () => {
    const sql = "SELECT id, name FROM users WHERE active = true";
    const result = await executeTool(sqlToJsonLegacy, { input: sql });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.type).toBe("select");
      expect(parsed.columns).toBeDefined();
    }
  });
});

// =====================================================
// SQL Parser
// =====================================================
describe("SQL Parser", () => {
  it("should have correct metadata", () => {
    expect(sqlParser.meta.id).toBe("sql/sql-parser");
    expect(sqlParser.meta.category).toBe("sql");
  });

  it("should parse a SELECT query", async () => {
    const result = await executeTool(sqlParser, { input: SAMPLE_SELECT });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.type).toBe("SELECT");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(sqlParser, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// SQL Explainer
// =====================================================
describe("SQL Explainer", () => {
  it("should have correct metadata", () => {
    expect(sqlExplainer.meta.id).toBe("sql/sql-explainer");
    expect(sqlExplainer.meta.category).toBe("sql");
  });

  it("should explain a SELECT query", async () => {
    const result = await executeTool(sqlExplainer, { input: SAMPLE_SQL });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "retrieves"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(sqlExplainer, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// SQL to NoSQL
// =====================================================
describe("SQL to NoSQL", () => {
  it("should have correct metadata", () => {
    expect(sqlToNosql.meta.id).toBe("sql/sql-to-nosql");
    expect(sqlToNosql.meta.category).toBe("sql");
  });

  it("should convert SELECT to MongoDB", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT name FROM users WHERE age > 30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "users"
      );
    }
  });
});

// =====================================================
// SQL Dialect Converter
// =====================================================
describe("SQL Dialect Converter", () => {
  it("should have correct metadata", () => {
    expect(sqlDialectConverter.meta.id).toBe("sql/sql-dialect-converter");
    expect(sqlDialectConverter.meta.category).toBe("sql");
  });

  it("should convert MySQL to PostgreSQL", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "SELECT * FROM users LIMIT 10" },
      { from: "mysql", to: "postgresql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(sqlDialectConverter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// SQL Query Builder
// =====================================================
describe("SQL Query Builder", () => {
  it("should have correct metadata", () => {
    expect(sqlQueryBuilder.meta.id).toBe("sql/sql-query-builder");
    expect(sqlQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a SELECT query", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "id, name, email",
      where: "active = true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SELECT"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "users"
      );
    }
  });

  it("should build an INSERT query", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "insert",
      values: '{"name": "John", "email": "john@test.com"}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "INSERT"
      );
    }
  });
});

// =====================================================
// SQL Index Suggester
// =====================================================
describe("SQL Index Suggester", () => {
  it("should have correct metadata", () => {
    expect(sqlIndexSuggester.meta.id).toBe("sql/sql-index-suggester");
    expect(sqlIndexSuggester.meta.category).toBe("sql");
  });

  it("should suggest indexes for a query with WHERE", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input:
        "SELECT * FROM orders WHERE customer_id = 5 AND status = 'pending'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });
});

// =====================================================
// JSON to SQL Insert
// =====================================================
describe("JSON to SQL Insert", () => {
  it("should have correct metadata", () => {
    expect(jsonToSqlInsert.meta.id).toBe("sql/json-to-sql-insert");
    expect(jsonToSqlInsert.meta.category).toBe("sql");
  });

  it("should convert JSON array to INSERT", async () => {
    const json = JSON.stringify([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    const result = await executeTool(jsonToSqlInsert, { input: json });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "INSERT INTO"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Alice"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(jsonToSqlInsert, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// CSV to SQL Insert
// =====================================================
describe("CSV to SQL Insert", () => {
  it("should have correct metadata", () => {
    expect(csvToSqlInsert.meta.id).toBe("sql/csv-to-sql-insert");
    expect(csvToSqlInsert.meta.category).toBe("sql");
  });

  it("should convert CSV to INSERT statements", async () => {
    const csv = "name,age\nAlice,30\nBob,25";
    const result = await executeTool(csvToSqlInsert, { input: csv });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "INSERT INTO"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Alice"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(csvToSqlInsert, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Connection String Builder
// =====================================================
describe("Connection String Builder", () => {
  it("should have correct metadata", () => {
    expect(connectionStringBuilder.meta.id).toBe(
      "sql/connection-string-builder"
    );
    expect(connectionStringBuilder.meta.category).toBe("sql");
  });

  it("should build PostgreSQL URI", async () => {
    const result = await executeTool(connectionStringBuilder, {
      driver: "postgresql",
      host: "localhost",
      database: "mydb",
      username: "admin",
      password: "secret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "postgresql://"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "localhost"
      );
    }
  });

  it("should build MySQL URI with defaults", async () => {
    const result = await executeTool(connectionStringBuilder, {
      driver: "mysql",
    });
    expect(result.success).toBe(true);
  });
});

// =====================================================
// DSN Parser
// =====================================================
describe("DSN Parser", () => {
  it("should have correct metadata", () => {
    expect(dsnParser.meta.id).toBe("sql/dsn-parser");
    expect(dsnParser.meta.category).toBe("sql");
  });

  it("should parse PHP-style DSN", async () => {
    const result = await executeTool(dsnParser, {
      input: "mysql:host=localhost;port=3306;dbname=testdb",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.driver).toBe("mysql");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(dsnParser, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Redis Command Builder
// =====================================================
describe("Redis Command Builder", () => {
  it("should have correct metadata", () => {
    expect(redisCommandBuilder.meta.id).toBe("sql/redis-command-builder");
    expect(redisCommandBuilder.meta.category).toBe("sql");
  });

  it("should build a GET command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "get",
      key: "mykey",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("GET");
      expect((result.data as Record<string, unknown>).output).toContain(
        "mykey"
      );
    }
  });

  it("should build a SET command", async () => {
    const result = await executeTool(redisCommandBuilder, {
      operation: "set",
      key: "mykey",
      value: "myvalue",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("SET");
    }
  });
});

// =====================================================
// MongoDB Query Builder
// =====================================================
describe("MongoDB Query Builder", () => {
  it("should have correct metadata", () => {
    expect(mongodbQueryBuilder.meta.id).toBe("sql/mongodb-query-builder");
    expect(mongodbQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a find query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "find",
      collection: "users",
      filter: '{"age": {"$gt": 30}}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "users"
      );
      expect((result.data as Record<string, unknown>).output).toContain("find");
    }
  });

  it("should build an insertOne query", async () => {
    const result = await executeTool(mongodbQueryBuilder, {
      operation: "insertOne",
      collection: "users",
      document: '{"name": "Alice", "age": 30}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "insertOne"
      );
    }
  });
});

// =====================================================
// Elasticsearch Query Builder
// =====================================================
describe("Elasticsearch Query Builder", () => {
  it("should have correct metadata", () => {
    expect(elasticsearchQueryBuilder.meta.id).toBe(
      "sql/elasticsearch-query-builder"
    );
    expect(elasticsearchQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a match query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match",
      index: "articles",
      field: "title",
      value: "elasticsearch",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "match"
      );
    }
  });

  it("should build a match_all query", async () => {
    const result = await executeTool(elasticsearchQueryBuilder, {
      queryType: "match_all",
      index: "articles",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "match_all"
      );
    }
  });
});

// =====================================================
// Database URL Converter
// =====================================================
describe("Database URL Converter", () => {
  it("should have correct metadata", () => {
    expect(databaseUrlConverter.meta.id).toBe("sql/database-url-converter");
    expect(databaseUrlConverter.meta.category).toBe("sql");
  });

  it("should convert PostgreSQL URL to env format", async () => {
    const result = await executeTool(databaseUrlConverter, {
      input: "postgresql://user:pass@localhost:5432/mydb",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(databaseUrlConverter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// ER Diagram Generator
// =====================================================
describe("ER Diagram Generator", () => {
  it("should have correct metadata", () => {
    expect(erDiagramGenerator.meta.id).toBe("sql/er-diagram-generator");
    expect(erDiagramGenerator.meta.category).toBe("sql");
  });

  it("should generate ER diagram from CREATE TABLE", async () => {
    const sql = `CREATE TABLE users (
      id INT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE
    );
    CREATE TABLE orders (
      id INT PRIMARY KEY,
      user_id INT REFERENCES users(id),
      total DECIMAL(10,2)
    );`;
    const result = await executeTool(erDiagramGenerator, { input: sql });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "users"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "orders"
      );
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(erDiagramGenerator, { input: "" });
    expect(result.success).toBe(false);
  });
});
