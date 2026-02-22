import { describe, it, expect } from "vitest";
import { sqlQueryBuilder } from "../../../src/tools/sql/sql-query-builder";
import { executeTool } from "../../../src/core/executor";

describe("sqlQueryBuilder", () => {
  it("should have correct metadata", () => {
    expect(sqlQueryBuilder.meta.id).toBe("sql/sql-query-builder");
    expect(sqlQueryBuilder.meta.category).toBe("sql");
  });

  it("should build a simple SELECT query", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "*",
      where: "",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("SELECT *");
      expect(output).toContain("FROM users");
    }
  });

  it("should build SELECT with WHERE and ORDER BY", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "id, name, email",
      where: "age > 18",
      orderBy: "name ASC",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("WHERE age > 18");
      expect(output).toContain("ORDER BY name ASC");
    }
  });

  it("should build SELECT DISTINCT", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "country",
      where: "",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "standard",
      distinct: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("SELECT DISTINCT country");
    }
  });

  it("should build INSERT with JSON values", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "insert",
      columns: "",
      where: "",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: '{"name": "Alice", "age": 30}',
      setValues: "",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("INSERT INTO users");
      expect(output).toContain("name, age");
      expect(output).toContain("'Alice'");
      expect(output).toContain("30");
    }
  });

  it("should build UPDATE query", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "update",
      columns: "",
      where: "id = 1",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "name = 'Bob', age = 25",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("UPDATE users");
      expect(output).toContain("SET name = 'Bob'");
      expect(output).toContain("WHERE id = 1");
    }
  });

  it("should build DELETE query", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "delete",
      columns: "",
      where: "id = 1",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("DELETE FROM users");
      expect(output).toContain("WHERE id = 1");
    }
  });

  it("should use MySQL dialect quoting", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "*",
      where: "",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "mysql",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("`users`");
    }
  });

  it("should use PostgreSQL dialect quoting", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "*",
      where: "",
      orderBy: "",
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "postgresql",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('"users"');
    }
  });

  it("should include LIMIT and OFFSET", async () => {
    const result = await executeTool(sqlQueryBuilder, {
      table: "users",
      operation: "select",
      columns: "*",
      where: "",
      orderBy: "",
      limit: 10,
      offset: 20,
      groupBy: "",
      having: "",
      joins: "",
      values: "",
      setValues: "",
      dialect: "standard",
      distinct: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("LIMIT 10");
      expect(output).toContain("OFFSET 20");
    }
  });
});
