import { describe, it, expect } from "vitest";
import { urlBuilder } from "../../../src/tools/encoding/url-builder";
import { executeTool } from "../../../src/core/executor";

describe("urlBuilder", () => {
  it("should have correct metadata", () => {
    expect(urlBuilder.meta.id).toBe("encoding/url-builder");
  });

  it("should build a simple URL", async () => {
    const result = await executeTool(urlBuilder, {
      protocol: "https",
      hostname: "example.com",
      pathname: "/api/v1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "https://example.com/api/v1"
      );
    }
  });

  it("should build URL with query and hash", async () => {
    const result = await executeTool(urlBuilder, {
      protocol: "https",
      hostname: "example.com",
      pathname: "/",
      query: "key=value",
      hash: "top",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "https://example.com/?key=value#top"
      );
    }
  });

  it("should build URL with port", async () => {
    const result = await executeTool(urlBuilder, {
      protocol: "http",
      hostname: "localhost",
      port: "3000",
      pathname: "/",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "http://localhost:3000/"
      );
    }
  });

  it("should use defaults", async () => {
    const result = await executeTool(urlBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("https://example.com");
    }
  });
});
