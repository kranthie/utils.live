import { describe, it, expect } from "vitest";
import { sqlToTypescript } from "../../../src/tools/code/sql-to-typescript";
import { executeTool } from "../../../src/core/executor";

describe("sqlToTypescript", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(sqlToTypescript.meta.id).toBe("code/sql-to-typescript");
      expect(sqlToTypescript.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should convert simple CREATE TABLE", async () => {
      const sql = `CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL,
        age INT
      );`;
      const result = await executeTool(sqlToTypescript, { input: sql });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("export interface Users");
        expect(output).toContain("id: number");
        expect(output).toContain("name: string");
        expect(output).toContain("email: string");
        expect(output).toContain("age");
      }
    });

    it("should map SQL types correctly", async () => {
      const sql = `CREATE TABLE test (
        flag BOOLEAN NOT NULL,
        created TIMESTAMP NOT NULL,
        data JSON,
        uid UUID NOT NULL,
        blob BYTEA
      );`;
      const result = await executeTool(sqlToTypescript, { input: sql });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("boolean");
        expect(output).toContain("Date");
        expect(output).toContain("Record<string, unknown>");
        expect(output).toContain("string");
        expect(output).toContain("Buffer");
      }
    });

    it("should make nullable columns optional", async () => {
      const sql = `CREATE TABLE test (
        id INT PRIMARY KEY,
        optional_field VARCHAR(50)
      );`;
      const result = await executeTool(sqlToTypescript, { input: sql });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("optionalField?:");
        expect(output).toContain("| null");
      }
    });

    it("should skip constraints", async () => {
      const sql = `CREATE TABLE test (
        id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (name)
      );`;
      const result = await executeTool(sqlToTypescript, { input: sql });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("PRIMARY KEY");
        expect(output).not.toContain("UNIQUE");
      }
    });

    it("should handle IF NOT EXISTS", async () => {
      const sql = `CREATE TABLE IF NOT EXISTS test (id INT NOT NULL);`;
      const result = await executeTool(sqlToTypescript, { input: sql });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("interface Test");
      }
    });

    it("should not export when option is false", async () => {
      const sql = `CREATE TABLE test (id INT NOT NULL);`;
      const result = await executeTool(
        sqlToTypescript,
        { input: sql },
        { exportTypes: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("export ");
      }
    });

    it("should keep original column names when camelCase is false", async () => {
      const sql = `CREATE TABLE test (user_name VARCHAR(50) NOT NULL);`;
      const result = await executeTool(
        sqlToTypescript,
        { input: sql },
        { camelCase: false }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("user_name:");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(sqlToTypescript, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject input without CREATE TABLE", async () => {
      const result = await executeTool(sqlToTypescript, { input: "SELECT * FROM users;" });
      expect(result.success).toBe(false);
    });
  });
});
