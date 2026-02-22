import { describe, it, expect } from "vitest";
import { curlConverter } from "../../../src/tools/api/curl-converter";
import { executeTool } from "../../../src/core/executor";

describe("curlConverter", () => {
  it("should have correct metadata", () => {
    expect(curlConverter.meta.id).toBe("api/curl-converter");
    expect(curlConverter.meta.category).toBe("api");
  });

  it("should convert simple GET to fetch", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "fetch" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("fetch");
      expect(output).toContain("https://api.example.com/users");
    }
  });

  it("should convert POST with data to fetch", async () => {
    const result = await executeTool(
      curlConverter,
      {
        input: `curl -X POST -H 'Content-Type: application/json' -d '{"name":"test"}' https://api.example.com/users`,
      },
      { target: "fetch" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("POST");
      expect(output).toContain("body");
    }
  });

  it("should convert to axios", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "axios" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("axios");
    }
  });

  it("should convert to python-requests", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "python-requests" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("import requests");
      expect(output).toContain("requests.get");
    }
  });

  it("should convert to go", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "go" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("package main");
      expect(output).toContain("http.NewRequest");
    }
  });

  it("should handle -u auth flag", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl -u user:pass https://api.example.com/users" },
      { target: "axios" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("auth");
      expect(output).toContain("user");
    }
  });

  it("should auto-set method to POST when data provided", async () => {
    const result = await executeTool(
      curlConverter,
      { input: `curl -d '{"x":1}' https://api.example.com/data` },
      { target: "fetch" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("POST");
    }
  });

  it("should convert to rust", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "rust" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("reqwest");
    }
  });

  it("should convert to php-curl", async () => {
    const result = await executeTool(
      curlConverter,
      { input: "curl https://api.example.com/users" },
      { target: "php-curl" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("curl_init");
    }
  });

  it("should fail on non-curl input", async () => {
    const result = await executeTool(curlConverter, {
      input: "wget https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(curlConverter, { input: "" });
    expect(result.success).toBe(false);
  });
});
