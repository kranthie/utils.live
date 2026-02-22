import { describe, it, expect } from "vitest";
import { csvToSql } from "../../../src/tools/csv/to-sql";
import { executeTool } from "../../../src/core/executor";

describe("CSV to SQL - Table name sanitization", () => {
  const basicCsv = `name,age
John,30
Jane,25`;

  it("should strip semicolons from table name (prevents SQL injection)", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "data; DROP TABLE users; --" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Extract table names from backtick-quoted identifiers
      const output = (result.data as Record<string, unknown>).output as string;
      const tableNames = output.match(/`([^`]+)`/g) ?? [];
      expect(tableNames.length).toBeGreaterThan(0);
      for (const name of tableNames) {
        const inner = name.slice(1, -1);
        expect(inner).not.toContain(";");
        expect(inner).not.toContain(" ");
        expect(inner).toMatch(/^[a-zA-Z0-9_]+$/);
      }
    }
  });

  it("should strip single quotes from table name", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "data'; DROP TABLE users; --" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Extract table names from backtick-quoted identifiers
      const output = (result.data as Record<string, unknown>).output as string;
      const tableNames = output.match(/`([^`]+)`/g) ?? [];
      for (const name of tableNames) {
        const inner = name.slice(1, -1);
        expect(inner).not.toContain("'");
        expect(inner).not.toContain(";");
        expect(inner).toMatch(/^[a-zA-Z0-9_]+$/);
      }
    }
  });

  it("should strip backticks from table name", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "data` ; DROP TABLE users; --" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // The table name inside backticks should not contain backticks
      const output = (result.data as Record<string, unknown>).output as string;
      const tableNames = output.match(/`([^`]+)`/g) ?? [];
      for (const name of tableNames) {
        // Remove the surrounding backticks and check inner content
        const inner = name.slice(1, -1);
        expect(inner).not.toContain("`");
        expect(inner).not.toContain(";");
      }
    }
  });

  it("should strip parentheses from table name", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "data()" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      const tableNames = output.match(/`([^`]+)`/g) ?? [];
      for (const name of tableNames) {
        const inner = name.slice(1, -1);
        expect(inner).not.toContain("(");
        expect(inner).not.toContain(")");
      }
    }
  });

  it("should only allow alphanumeric and underscore in table name", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "my table!@#$%^&*" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      const tableNames = output.match(/`([^`]+)`/g) ?? [];
      for (const name of tableNames) {
        const inner = name.slice(1, -1);
        expect(inner).toMatch(/^[a-zA-Z0-9_]+$/);
      }
    }
  });

  it("should quote table names with backticks", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "my_table" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).toContain("CREATE TABLE `my_table`");
      expect(output).toContain("INSERT INTO `my_table`");
    }
  });

  it("should strip non-alphanumeric characters and replace with underscore", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "my table" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).toContain("`my_table`");
    }
  });

  it("should handle table name that is entirely special characters", async () => {
    const result = await executeTool(
      csvToSql,
      { input: basicCsv },
      { tableName: "!@#$%^&*()" }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      // Should fall back to a safe default
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).toContain("CREATE TABLE `data`");
    }
  });

  it("should quote default table name with backticks", async () => {
    const result = await executeTool(csvToSql, {
      input: basicCsv,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as Record<string, unknown>).output as string;
      expect(output).toContain("CREATE TABLE `data`");
      expect(output).toContain("INSERT INTO `data`");
    }
  });
});
