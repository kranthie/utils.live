import { describe, it, expect } from "vitest";
import { sqlToNosql } from "../../../src/tools/sql/sql-to-nosql";
import { executeTool } from "../../../src/core/executor";

describe("sqlToNosql", () => {
  it("should have correct metadata", () => {
    expect(sqlToNosql.meta.id).toBe("sql/sql-to-nosql");
    expect(sqlToNosql.meta.category).toBe("sql");
  });

  it("should convert simple SELECT to find", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT * FROM users",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.find");
    }
  });

  it("should convert SELECT with WHERE to find with filter", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT * FROM users WHERE age > 18",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("$gt");
      expect(output).toContain("18");
    }
  });

  it("should convert SELECT with projection", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT name, email FROM users",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('"name": 1');
      expect(output).toContain('"email": 1');
    }
  });

  it("should convert SELECT with ORDER BY", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT * FROM users ORDER BY name ASC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain(".sort");
      expect(output).toContain('"name"');
    }
  });

  it("should convert SELECT with LIMIT", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT * FROM users LIMIT 10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain(".limit(10)");
    }
  });

  it("should convert INSERT to insertOne", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "INSERT INTO users (name, age) VALUES ('Alice', 30)",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.insertOne");
      expect(output).toContain('"name"');
    }
  });

  it("should convert UPDATE to updateMany", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "UPDATE users SET name = 'Bob' WHERE id = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.updateMany");
      expect(output).toContain("$set");
    }
  });

  it("should convert DELETE to deleteMany", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "DELETE FROM users WHERE id = 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("db.users.deleteMany");
    }
  });

  it("should convert LIKE to $regex", async () => {
    const result = await executeTool(sqlToNosql, {
      input: "SELECT * FROM users WHERE name LIKE '%alice%'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("$regex");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(sqlToNosql, { input: "" });
    expect(result.success).toBe(false);
  });
});
