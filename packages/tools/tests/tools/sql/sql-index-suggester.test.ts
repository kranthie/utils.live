import { describe, it, expect } from "vitest";
import { sqlIndexSuggester } from "../../../src/tools/sql/sql-index-suggester";
import { executeTool } from "../../../src/core/executor";

describe("sqlIndexSuggester", () => {
  it("should have correct metadata", () => {
    expect(sqlIndexSuggester.meta.id).toBe("sql/sql-index-suggester");
    expect(sqlIndexSuggester.meta.category).toBe("sql");
  });

  it("should suggest index for WHERE clause", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT * FROM users WHERE email = 'test@example.com'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("CREATE INDEX");
      expect(output).toContain("email");
      expect(output).toContain("WHERE clause");
    }
  });

  it("should suggest index for ORDER BY", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT * FROM orders ORDER BY created_at DESC",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("created_at");
      expect(output).toContain("ORDER BY");
    }
  });

  it("should suggest index for GROUP BY", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT status, COUNT(*) FROM orders GROUP BY status",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("GROUP BY");
      expect(output).toContain("status");
    }
  });

  it("should suggest index for JOIN conditions", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT * FROM users JOIN orders ON users.id = orders.user_id",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Join condition");
    }
  });

  it("should warn about leading wildcard LIKE", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT * FROM users WHERE name LIKE '%test%'",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("WARNING");
      expect(output).toContain("wildcard");
    }
  });

  it("should handle query with no obvious index needs", async () => {
    const result = await executeTool(sqlIndexSuggester, {
      input: "SELECT 1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("No index suggestions");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(sqlIndexSuggester, { input: "" });
    expect(result.success).toBe(false);
  });
});
