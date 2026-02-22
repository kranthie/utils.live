import { describe, it, expect } from "vitest";
import { httpHeadersReference } from "../../../src/tools/network/http-headers-reference";
import { executeTool } from "../../../src/core/executor";

describe("httpHeadersReference", () => {
  it("should have correct metadata", () => {
    expect(httpHeadersReference.meta.id).toBe("network/http-headers-reference");
    expect(httpHeadersReference.meta.category).toBe("network");
  });

  it("should return all headers with default category", async () => {
    const result = await executeTool(httpHeadersReference, { category: "all", search: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Content-Type");
      expect(output).toContain("Authorization");
      expect(output).toContain("Cache-Control");
    }
  });

  it("should filter by security category", async () => {
    const result = await executeTool(httpHeadersReference, { category: "security", search: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Strict-Transport-Security");
      expect(output).toContain("X-Frame-Options");
      expect(output).not.toContain("Accept [request]");
    }
  });

  it("should filter by CORS category", async () => {
    const result = await executeTool(httpHeadersReference, { category: "cors", search: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Access-Control-Allow-Origin");
    }
  });

  it("should search by name", async () => {
    const result = await executeTool(httpHeadersReference, { category: "all", search: "cookie" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Cookie");
      expect(output).toContain("Set-Cookie");
    }
  });

  it("should return no matching message", async () => {
    const result = await executeTool(httpHeadersReference, { category: "all", search: "nonexistentheader" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("No matching headers found");
    }
  });
});
