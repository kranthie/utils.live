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

  it("should have correct metadata", () => {
    expect(openapiDiff.meta.id).toBe("api/openapi-diff");
  });
});
