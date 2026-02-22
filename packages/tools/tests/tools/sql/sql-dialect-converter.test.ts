import { describe, it, expect } from "vitest";
import { sqlDialectConverter } from "../../../src/tools/sql/sql-dialect-converter";
import { executeTool } from "../../../src/core/executor";

describe("sqlDialectConverter", () => {
  it("should have correct metadata", () => {
    expect(sqlDialectConverter.meta.id).toBe("sql/sql-dialect-converter");
    expect(sqlDialectConverter.meta.category).toBe("sql");
  });

  it("should convert MySQL to PostgreSQL (backticks to quotes)", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "SELECT `name` FROM `users`" },
      { from: "mysql", to: "postgresql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('"name"');
      expect(output).toContain('"users"');
      expect(output).not.toContain("`");
    }
  });

  it("should convert AUTO_INCREMENT to GENERATED ALWAYS", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "id INT AUTO_INCREMENT PRIMARY KEY" },
      { from: "mysql", to: "postgresql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("GENERATED ALWAYS AS IDENTITY");
    }
  });

  it("should convert TINYINT(1) to BOOLEAN", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "active TINYINT(1)" },
      { from: "mysql", to: "postgresql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("BOOLEAN");
    }
  });

  it("should convert PostgreSQL to MySQL", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: 'SELECT "name" FROM "users"' },
      { from: "postgresql", to: "mysql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("`name`");
    }
  });

  it("should convert SERIAL to INT AUTO_INCREMENT", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "id SERIAL PRIMARY KEY" },
      { from: "postgresql", to: "mysql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("AUTO_INCREMENT");
    }
  });

  it("should convert to SQLite", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "CREATE TABLE users (id INT AUTO_INCREMENT, name VARCHAR(100))" },
      { from: "mysql", to: "sqlite" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("AUTOINCREMENT");
      expect(output).toContain("TEXT");
    }
  });

  it("should return same SQL when source equals target", async () => {
    const sql = "SELECT * FROM users";
    const result = await executeTool(
      sqlDialectConverter,
      { input: sql },
      { from: "mysql", to: "mysql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe(sql);
    }
  });

  it("should add conversion comment header", async () => {
    const result = await executeTool(
      sqlDialectConverter,
      { input: "SELECT 1" },
      { from: "mysql", to: "postgresql" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Converted from MYSQL to POSTGRESQL");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(sqlDialectConverter, { input: "" });
    expect(result.success).toBe(false);
  });
});
