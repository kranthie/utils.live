import { describe, it, expect } from "vitest";
import { graphqlSchemaGenerator } from "../../../src/tools/api/graphql-schema-generator";
import { executeTool } from "../../../src/core/executor";

describe("graphqlSchemaGenerator", () => {
  it("should have correct metadata", () => {
    expect(graphqlSchemaGenerator.meta.id).toBe("api/graphql-schema-generator");
    expect(graphqlSchemaGenerator.meta.category).toBe("api");
  });

  it("should generate schema from simple JSON object", async () => {
    const input = JSON.stringify({ id: 1, name: "Alice", active: true });
    const result = await executeTool(graphqlSchemaGenerator, { input });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Root");
      expect(output).toContain("id: Int");
      expect(output).toContain("name: String");
      expect(output).toContain("active: Boolean");
    }
  });

  it("should generate schema from array of objects", async () => {
    const input = JSON.stringify([
      { id: 1, name: "Alice" },
      { id: 2, email: "bob@example.com" },
    ]);
    const result = await executeTool(graphqlSchemaGenerator, { input });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Root");
    }
  });

  it("should generate Query type when addQueries is true", async () => {
    const input = JSON.stringify({ id: 1, name: "Test" });
    const result = await executeTool(
      graphqlSchemaGenerator,
      { input },
      { addQueries: true, addMutations: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Query");
    }
  });

  it("should generate Mutation type when addMutations is true", async () => {
    const input = JSON.stringify({ id: 1, name: "Test" });
    const result = await executeTool(
      graphqlSchemaGenerator,
      { input },
      { addQueries: false, addMutations: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Mutation");
      expect(output).toContain("createRoot");
      expect(output).toContain("deleteRoot");
    }
  });

  it("should use custom root name", async () => {
    const input = JSON.stringify({ id: 1, title: "Hello" });
    const result = await executeTool(
      graphqlSchemaGenerator,
      { input },
      { rootName: "Post" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Post");
    }
  });

  it("should infer Float for non-integer numbers", async () => {
    const input = JSON.stringify({ price: 9.99 });
    const result = await executeTool(graphqlSchemaGenerator, { input });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Float");
    }
  });

  it("should handle nested objects", async () => {
    const input = JSON.stringify({
      id: 1,
      address: { street: "123 Main", city: "Springfield" },
    });
    const result = await executeTool(graphqlSchemaGenerator, { input });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Address");
      expect(output).toContain("street: String");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(graphqlSchemaGenerator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(graphqlSchemaGenerator, {
      input: "not json",
    });
    expect(result.success).toBe(false);
  });
});
