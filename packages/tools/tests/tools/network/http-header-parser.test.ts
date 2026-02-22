import { describe, it, expect } from "vitest";
import { httpHeaderParser } from "../../../src/tools/network/http-header-parser";
import { executeTool } from "../../../src/core/executor";

describe("httpHeaderParser", () => {
  it("should have correct metadata", () => {
    expect(httpHeaderParser.meta.id).toBe("network/http-header-parser");
    expect(httpHeaderParser.meta.category).toBe("network");
  });

  it("should parse standard headers", async () => {
    const headers =
      "Content-Type: application/json\nAccept: text/html\nAuthorization: Bearer token123";
    const result = await executeTool(httpHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.headerCount).toBe(3);
      const hdrs = data.headers as Record<string, string>;
      expect(hdrs["Content-Type"]).toBe("application/json");
      expect(hdrs["Authorization"]).toBe("Bearer token123");
    }
  });

  it("should skip HTTP status line", async () => {
    const headers = "HTTP/1.1 200 OK\nContent-Type: text/html\nServer: nginx";
    const result = await executeTool(httpHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.headerCount).toBe(2);
    }
  });

  it("should handle headers with colons in values", async () => {
    const headers = "Set-Cookie: id=abc; Path=/; Domain=example.com";
    const result = await executeTool(httpHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      const hdrs = data.headers as Record<string, string>;
      expect(hdrs["Set-Cookie"]).toContain("id=abc");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(httpHeaderParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail when no valid headers found", async () => {
    const result = await executeTool(httpHeaderParser, {
      input: "no headers here",
    });
    expect(result.success).toBe(false);
  });

  it("should skip blank lines", async () => {
    const headers = "Content-Type: text/html\n\nServer: nginx\n\n";
    const result = await executeTool(httpHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(
        (result.data as { output: string }).output
      ) as Record<string, unknown>;
      expect(data.headerCount).toBe(2);
    }
  });
});
