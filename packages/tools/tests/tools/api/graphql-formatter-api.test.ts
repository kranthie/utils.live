import { describe, it, expect } from "vitest";
import { graphqlFormatterApi } from "../../../src/tools/api/graphql-formatter-api";
import { executeTool } from "../../../src/core/executor";

describe("graphqlFormatterApi", () => {
  it("should have correct metadata", () => {
    expect(graphqlFormatterApi.meta.id).toBe("api/graphql-formatter-api");
    expect(graphqlFormatterApi.meta.category).toBe("api");
  });

  it("should format a simple query", async () => {
    const result = await executeTool(graphqlFormatterApi, {
      input: "query { user { id name email } }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("query");
      expect(output).toContain("user");
      expect(output).toContain("{");
      expect(output).toContain("}");
    }
  });

  it("should format with custom indent", async () => {
    const result = await executeTool(
      graphqlFormatterApi,
      { input: "type User { id: ID name: String }" },
      { indent: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("    "); // 4 spaces
    }
  });

  it("should handle nested queries", async () => {
    const result = await executeTool(graphqlFormatterApi, {
      input: "query { users { id posts { title content } } }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("posts");
      expect(output).toContain("title");
    }
  });

  it("should preserve comments", async () => {
    const result = await executeTool(graphqlFormatterApi, {
      input: "# My query\nquery { user { id } }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("# My query");
    }
  });

  it("should handle string literals", async () => {
    const result = await executeTool(graphqlFormatterApi, {
      input: 'query { user(name: "John Doe") { id } }',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('"John Doe"');
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(graphqlFormatterApi, { input: "" });
    expect(result.success).toBe(false);
  });
});
