import { describe, it, expect } from "vitest";
import { graphqlToTypescript } from "../../../src/tools/api/graphql-to-typescript";
import { executeTool } from "../../../src/core/executor";

describe("graphqlToTypescript", () => {
  it("should have correct metadata", () => {
    expect(graphqlToTypescript.meta.id).toBe("api/graphql-to-typescript");
    expect(graphqlToTypescript.meta.category).toBe("api");
  });

  it("should convert a simple type", async () => {
    const schema = `type User {
  id: ID!
  name: String!
  email: String
}`;
    const result = await executeTool(graphqlToTypescript, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("interface User");
      expect(output).toContain("id: string");
      expect(output).toContain("name: string");
      expect(output).toContain("email");
    }
  });

  it("should handle enum types", async () => {
    const schema = `enum Status {
  ACTIVE
  INACTIVE
  PENDING
}`;
    const result = await executeTool(graphqlToTypescript, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("enum Status");
      expect(output).toContain('ACTIVE = "ACTIVE"');
    }
  });

  it("should handle array fields", async () => {
    const schema = `type Post {
  tags: [String!]!
}`;
    const result = await executeTool(graphqlToTypescript, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("tags");
      expect(output).toContain("string[]");
    }
  });

  it("should mark nullable fields as optional", async () => {
    const schema = `type User {
  id: ID!
  bio: String
}`;
    const result = await executeTool(
      graphqlToTypescript,
      { input: schema },
      { addNullable: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("bio?:");
    }
  });

  it("should add readonly when option enabled", async () => {
    const schema = `type User {
  id: ID!
}`;
    const result = await executeTool(
      graphqlToTypescript,
      { input: schema },
      { readonlyTypes: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("readonly id");
    }
  });

  it("should not export when exportTypes is false", async () => {
    const schema = `type User {
  id: ID!
}`;
    const result = await executeTool(
      graphqlToTypescript,
      { input: schema },
      { exportTypes: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).not.toContain("export ");
    }
  });

  it("should handle scalar types", async () => {
    const schema = "scalar DateTime";
    const result = await executeTool(graphqlToTypescript, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type DateTime = string");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(graphqlToTypescript, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail when no types found", async () => {
    const result = await executeTool(graphqlToTypescript, {
      input: "just some random text",
    });
    expect(result.success).toBe(false);
  });
});
