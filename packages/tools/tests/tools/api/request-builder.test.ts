import { describe, it, expect } from "vitest";
import { requestBuilder } from "../../../src/tools/api/request-builder";
import { executeTool } from "../../../src/core/executor";

describe("requestBuilder", () => {
  it("should have correct metadata", () => {
    expect(requestBuilder.meta.id).toBe("api/request-builder");
    expect(requestBuilder.meta.category).toBe("api");
  });

  it("should build a simple GET fetch request", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/users",
      method: "GET",
      headers: "",
      body: "",
      queryParams: "",
      format: "fetch",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("fetch");
      expect(output).toContain("https://api.example.com/users");
    }
  });

  it("should build a POST fetch request with body", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/users",
      method: "POST",
      headers: '{"Content-Type": "application/json"}',
      body: '{"name":"Alice"}',
      queryParams: "",
      format: "fetch",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("POST");
      expect(output).toContain("body");
      expect(output).toContain("Content-Type");
    }
  });

  it("should build a cURL command", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/users",
      method: "POST",
      headers: "Authorization: Bearer token123",
      body: '{"name":"Bob"}',
      queryParams: "",
      format: "curl",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("curl");
      expect(output).toContain("-X POST");
      expect(output).toContain("-H 'Authorization: Bearer token123'");
    }
  });

  it("should build an HTTPie command", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/data",
      method: "GET",
      headers: "",
      body: "",
      queryParams: "",
      format: "httpie",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("http");
      expect(output).toContain("GET");
    }
  });

  it("should build a wget command", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/data",
      method: "GET",
      headers: "",
      body: "",
      queryParams: "",
      format: "wget",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("wget");
    }
  });

  it("should append query params to URL", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com/users",
      method: "GET",
      headers: "",
      body: "",
      queryParams: "page=1\nlimit=10",
      format: "fetch",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("page=1");
      expect(output).toContain("limit=10");
    }
  });

  it("should parse headers from key: value format", async () => {
    const result = await executeTool(requestBuilder, {
      url: "https://api.example.com",
      method: "GET",
      headers: "Accept: application/json\nX-Custom: value",
      body: "",
      queryParams: "",
      format: "curl",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Accept");
      expect(output).toContain("X-Custom");
    }
  });
});
