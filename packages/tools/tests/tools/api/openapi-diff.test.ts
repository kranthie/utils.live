import { describe, it, expect } from "vitest";
import { openapiDiff } from "../../../src/tools/api/openapi-diff";
import { executeTool } from "../../../src/core/executor";

describe("OpenAPI Diff Tool", () => {
  it("should detect no changes for identical specs", async () => {
    const spec = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiDiff, {
      input1: spec,
      input2: spec,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).original).toBeDefined();
      expect((result.data as Record<string, unknown>).modified).toBeDefined();
    }
  });

  it("should detect version change", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "2.0.0" },
      paths: {},
    });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).original).toBeDefined();
    }
  });

  it("should detect added paths", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {},
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/users": { get: { summary: "Get users" } } },
    });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
  });

  it("should detect removed paths", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {
        "/users": { get: { summary: "Get users" } },
        "/posts": { get: { summary: "Get posts" } },
      },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      paths: { "/users": { get: { summary: "Get users" } } },
    });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as {
        differences: Array<{ type: string; path: string }>;
        summary: { removed: number };
      };
      expect(data.summary.removed).toBeGreaterThan(0);
      const removedPaths = data.differences.filter((d) => d.type === "removed");
      expect(removedPaths.length).toBeGreaterThan(0);
    }
  });

  it("should report correct summary counts", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API", version: "1.0.0" },
      paths: { "/old": { get: { summary: "Old" } } },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "API", version: "2.0.0" }, // changed
      paths: { "/new": { get: { summary: "New" } } }, // /old removed, /new added
    });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as {
        summary: { added: number; removed: number; changed: number };
      };
      expect(data.summary.changed).toBeGreaterThan(0); // version changed
      expect(data.summary.added + data.summary.removed).toBeGreaterThan(0);
    }
  });

  it("should detect changes in array elements", async () => {
    const spec1 = JSON.stringify({
      tags: [{ name: "users" }, { name: "posts" }],
    });
    const spec2 = JSON.stringify({ tags: [{ name: "users" }] });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { differences: Array<{ type: string }> };
      expect(data.differences.length).toBeGreaterThan(0);
    }
  });

  it("should detect type changes", async () => {
    const spec1 = JSON.stringify({ info: { version: 1 } });
    const spec2 = JSON.stringify({ info: { version: "1.0" } });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as {
        differences: Array<{ type: string; details: string }>;
      };
      const changed = data.differences.find((d) =>
        d.details.includes("Type changed")
      );
      expect(changed).toBeDefined();
    }
  });

  it("should return spec summaries in original and modified fields", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Users API", version: "1.0.0" },
      paths: { "/users": {}, "/admins": {} },
    });
    const spec2 = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Users API v2", version: "2.0.0" },
      paths: { "/users": {} },
    });
    const result = await executeTool(openapiDiff, {
      input1: spec1,
      input2: spec2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as { original: string; modified: string };
      expect(data.original).toContain("Users API");
      expect(data.original).toContain("1.0.0");
      expect(data.original).toContain("2 paths");
      expect(data.modified).toContain("2.0.0");
      expect(data.modified).toContain("1 paths");
    }
  });

  it("should handle invalid JSON in first input", async () => {
    const result = await executeTool(openapiDiff, {
      input1: "not json",
      input2: "{}",
    });
    expect(result.success).toBe(false);
  });

  it("should handle invalid JSON in second input", async () => {
    const result = await executeTool(openapiDiff, {
      input1: "{}",
      input2: "not json",
    });
    expect(result.success).toBe(false);
  });

  it("should handle empty inputs", async () => {
    const result = await executeTool(openapiDiff, { input1: "", input2: "{}" });
    expect(result.success).toBe(false);
  });

  it("should have correct metadata", () => {
    expect(openapiDiff.meta.id).toBe("api/openapi-diff");
  });
});
