import { describe, it, expect } from "vitest";
import { openapiMerger } from "../../../src/tools/api/openapi-merger";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Merger Tool", () => {
  it("should merge two specs", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API 1", version: "1.0.0" },
      paths: { "/users": { get: { summary: "Get users" } } },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API 2", version: "1.0.0" },
      paths: { "/products": { get: { summary: "Get products" } } },
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).original).toBeDefined();
      expect((result.data as Record<string, unknown>).modified).toBeDefined();
    }
  });

  it("should handle invalid JSON in first input", async () => {
    const result = await executeTool(openapiMerger, {
      input1: "not json",
      input2: "{}",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBeDefined();
    }
  });

  it("should merge paths from both specs without losing any", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Users API", version: "1.0.0" },
      paths: { "/users": { get: { summary: "List users" } } },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Products API", version: "1.0.0" },
      paths: { "/products": { get: { summary: "List products" } } },
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { output: string };
      const merged = JSON.parse(data.output) as Record<string, unknown>;
      const paths = merged.paths as Record<string, unknown>;
      expect(paths["/users"]).toBeDefined();
      expect(paths["/products"]).toBeDefined();
    }
  });

  it("should combine titles with + separator", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API A", version: "1.0.0" },
      paths: {},
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API B", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { output: string };
      const merged = JSON.parse(data.output) as { info: { title: string } };
      expect(merged.info.title).toBe("API A + API B");
    }
  });

  it("should merge servers without duplicates", async () => {
    const server = { url: "https://api.example.com" };
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "A", version: "1.0.0" },
      paths: {},
      servers: [server],
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "B", version: "1.0.0" },
      paths: {},
      servers: [server, { url: "https://staging.example.com" }],
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { output: string };
      const merged = JSON.parse(data.output) as { servers: unknown[] };
      // The duplicate server should not appear twice
      expect(merged.servers.length).toBe(2);
    }
  });

  it("should merge components schemas from both specs", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "A", version: "1.0.0" },
      paths: {},
      components: { schemas: { User: { type: "object" } } },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "B", version: "1.0.0" },
      paths: {},
      components: { schemas: { Product: { type: "object" } } },
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { output: string };
      const merged = JSON.parse(data.output) as {
        components: { schemas: Record<string, unknown> };
      };
      expect(merged.components.schemas.User).toBeDefined();
      expect(merged.components.schemas.Product).toBeDefined();
    }
  });

  it("should merge tags deduplicating by name", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "A", version: "1.0.0" },
      paths: {},
      tags: [{ name: "users" }, { name: "shared" }],
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "B", version: "1.0.0" },
      paths: {},
      tags: [{ name: "products" }, { name: "shared" }],
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { output: string };
      const merged = JSON.parse(data.output) as {
        tags: Array<{ name: string }>;
      };
      const tagNames = merged.tags.map((t) => t.name);
      expect(tagNames).toContain("users");
      expect(tagNames).toContain("products");
      // shared should only appear once
      expect(tagNames.filter((n) => n === "shared").length).toBe(1);
    }
  });

  it("should return spec info in original and modified fields", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "First", version: "1.0.0" },
      paths: { "/a": {} },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Second", version: "2.0.0" },
      paths: { "/b": {} },
    });
    const result = await executeTool(openapiMerger, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { original: string; modified: string };
      expect(data.original).toContain("First");
      expect(data.modified).toContain("Second");
    }
  });

  it("should handle invalid JSON in second input", async () => {
    const result = await executeTool(openapiMerger, {
      input1: "{}",
      input2: "not json",
    });
    expect(result.success).toBe(false);
  });

  it("should handle empty inputs", async () => {
    const result = await executeTool(openapiMerger, {
      input1: "",
      input2: "{}",
    });
    expect(result.success).toBe(false);
  });

  it("should have correct metadata", () => {
    expect(openapiMerger.meta.id).toBe("api/openapi-merger");
  });
});
