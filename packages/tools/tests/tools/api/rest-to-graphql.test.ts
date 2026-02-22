import { describe, it, expect } from "vitest";
import { restToGraphql } from "../../../src/tools/api/rest-to-graphql";
import { executeTool } from "../../../src/core/executor";

describe("restToGraphql", () => {
  it("should have correct metadata", () => {
    expect(restToGraphql.meta.id).toBe("api/rest-to-graphql");
    expect(restToGraphql.meta.category).toBe("api");
  });

  it("should generate schema from GET endpoints", async () => {
    const endpoints = JSON.stringify([
      {
        method: "GET",
        path: "/users",
        responseBody: { id: 1, name: "Alice", email: "alice@test.com" },
      },
      {
        method: "GET",
        path: "/users/:id",
        responseBody: { id: 1, name: "Alice" },
      },
    ]);
    const result = await executeTool(restToGraphql, { input: endpoints });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type User");
      expect(output).toContain("type Query");
      expect(output).toContain("user(id: ID!)");
      expect(output).toContain("users(limit: Int, offset: Int)");
    }
  });

  it("should generate mutations from POST/PUT/DELETE", async () => {
    const endpoints = JSON.stringify([
      {
        method: "POST",
        path: "/users",
        requestBody: { name: "Alice", email: "alice@test.com" },
        responseBody: { id: 1, name: "Alice" },
      },
      {
        method: "DELETE",
        path: "/users/:id",
      },
    ]);
    const result = await executeTool(restToGraphql, { input: endpoints });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Mutation");
      expect(output).toContain("createUser");
      expect(output).toContain("deleteUser");
    }
  });

  it("should handle endpoints object wrapper", async () => {
    const input = JSON.stringify({
      endpoints: [
        {
          method: "GET",
          path: "/products",
          responseBody: { id: 1, title: "Widget", price: 9.99 },
        },
      ],
    });
    const result = await executeTool(restToGraphql, { input });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("type Product");
      expect(output).toContain("title: String");
    }
  });

  it("should infer Float type for decimal numbers", async () => {
    const endpoints = JSON.stringify([
      {
        method: "GET",
        path: "/products",
        responseBody: { price: 9.99 },
      },
    ]);
    const result = await executeTool(restToGraphql, { input: endpoints });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Float");
    }
  });

  it("should generate input types for mutations", async () => {
    const endpoints = JSON.stringify([
      {
        method: "POST",
        path: "/users",
        requestBody: { name: "Alice", email: "alice@test.com" },
        responseBody: { id: 1, name: "Alice" },
      },
    ]);
    const result = await executeTool(restToGraphql, { input: endpoints });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("input CreateUserInput");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(restToGraphql, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(restToGraphql, { input: "not json" });
    expect(result.success).toBe(false);
  });
});
