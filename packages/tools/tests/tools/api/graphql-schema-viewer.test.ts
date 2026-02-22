import { describe, it, expect } from "vitest";
import { graphqlSchemaViewer } from "../../../src/tools/api/graphql-schema-viewer";
import { executeTool } from "../../../src/core/executor";

describe("GraphQL Schema Viewer Tool", () => {
  it("should format a GraphQL schema", async () => {
    const schema = `type Query {\nusers: [User]\nuser(id: ID!): User\n}\ntype User {\nid: ID!\nname: String\n}`;
    const result = await executeTool(graphqlSchemaViewer, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "type Query"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "type User"
      );
    }
  });

  it("should handle mutations", async () => {
    const schema = `type Mutation {\ncreateUser(name: String!): User\n}`;
    const result = await executeTool(graphqlSchemaViewer, { input: schema });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Mutation"
      );
    }
  });

  it("should handle empty input", async () => {
    const result = await executeTool(graphqlSchemaViewer, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should have correct metadata", () => {
    expect(graphqlSchemaViewer.meta.id).toBe("api/graphql-schema-viewer");
  });
});
