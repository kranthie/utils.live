import { describe, it, expect } from "vitest";
import { sqlParser } from "../../../src/tools/sql/sql-parser";
import { executeTool } from "../../../src/core/executor";

describe("sqlParser", () => {
  it("should have correct metadata", () => {
    expect(sqlParser.meta.id).toBe("sql/sql-parser");
    expect(sqlParser.meta.category).toBe("sql");
  });

  it("should parse a SELECT query", async () => {
    const result = await executeTool(sqlParser, {
      input:
        "SELECT id, name, email FROM users WHERE age > 18 ORDER BY name LIMIT 10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("SELECT");
      expect(data.table).toBe("users");
      expect(data.columns).toContain("id");
      expect(data.where).toContain("age");
      expect(data.limit).toBe(10);
    }
  });

  it("should parse SELECT with ORDER BY", async () => {
    const result = await executeTool(sqlParser, {
      input: "SELECT * FROM products ORDER BY price DESC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.orderBy).toBeDefined();
    }
  });

  it("should parse SELECT with GROUP BY", async () => {
    const result = await executeTool(sqlParser, {
      input: "SELECT status, COUNT(*) FROM orders GROUP BY status",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.groupBy).toBeDefined();
      expect(data.groupBy).toContain("status");
    }
  });

  it("should parse an INSERT query", async () => {
    const result = await executeTool(sqlParser, {
      input:
        "INSERT INTO users (name, email) VALUES ('Alice', 'alice@test.com')",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("INSERT");
      expect(data.table).toBe("users");
      expect(data.columns).toContain("name");
    }
  });

  it("should parse an UPDATE query", async () => {
    const result = await executeTool(sqlParser, {
      input: "UPDATE users SET name = 'Bob' WHERE id = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("UPDATE");
      expect(data.table).toBe("users");
      expect(data.where).toContain("id");
    }
  });

  it("should parse a DELETE query", async () => {
    const result = await executeTool(sqlParser, {
      input: "DELETE FROM users WHERE id = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("DELETE");
      expect(data.table).toBe("users");
    }
  });

  it("should parse a CREATE TABLE statement", async () => {
    const result = await executeTool(sqlParser, {
      input: "CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100))",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("CREATE TABLE");
      expect(data.table).toBe("users");
    }
  });

  it("should strip SQL comments", async () => {
    const result = await executeTool(sqlParser, {
      input: "-- This is a comment\nSELECT * FROM users",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.type).toBe("SELECT");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(sqlParser, { input: "" });
    expect(result.success).toBe(false);
  });
});
