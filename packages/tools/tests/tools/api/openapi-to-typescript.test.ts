import { describe, it, expect } from "vitest";
import { openapiToTypescript } from "../../../src/tools/api/openapi-to-typescript";
import { executeTool } from "../../../src/core/executor";

const sampleSpec = {
  openapi: "3.0.0",
  info: { title: "Test API", version: "1.0.0" },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string" },
        },
      },
      Status: {
        type: "string",
        enum: ["active", "inactive"],
      },
    },
  },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        summary: "List all users",
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/User" } },
              },
            },
          },
        },
      },
      post: {
        operationId: "createUser",
        summary: "Create user",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" },
            },
          },
        },
        responses: {
          "201": {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
  },
};

describe("openapiToTypescript", () => {
  it("should have correct metadata", () => {
    expect(openapiToTypescript.meta.id).toBe("api/openapi-to-typescript");
    expect(openapiToTypescript.meta.category).toBe("api");
  });

  it("should generate types from schemas", async () => {
    const result = await executeTool(openapiToTypescript, {
      input: JSON.stringify(sampleSpec),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("interface User");
      expect(output).toContain("id: number");
      expect(output).toContain("name: string");
    }
  });

  it("should generate enum types", async () => {
    const result = await executeTool(openapiToTypescript, {
      input: JSON.stringify(sampleSpec),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Status");
      expect(output).toContain('"active"');
    }
  });

  it("should generate client when option enabled", async () => {
    const result = await executeTool(
      openapiToTypescript,
      { input: JSON.stringify(sampleSpec) },
      { generateClient: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("listUsers");
      expect(output).toContain("createUser");
    }
  });

  it("should handle required vs optional fields", async () => {
    const result = await executeTool(openapiToTypescript, {
      input: JSON.stringify(sampleSpec),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      // id and name are required, email is optional
      expect(output).toContain("id: number;");
      expect(output).toContain("name: string;");
      expect(output).toContain("email?: string;");
    }
  });

  it("should handle $ref references", async () => {
    const result = await executeTool(
      openapiToTypescript,
      { input: JSON.stringify(sampleSpec) },
      { generateClient: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("User");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(openapiToTypescript, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JSON", async () => {
    const result = await executeTool(openapiToTypescript, { input: "not json" });
    expect(result.success).toBe(false);
  });

  it("should fail on spec with no schemas or paths", async () => {
    const result = await executeTool(openapiToTypescript, {
      input: JSON.stringify({ openapi: "3.0.0" }),
    });
    expect(result.success).toBe(false);
  });
});
