import { describe, it, expect } from "vitest";
import { queryStringBuilder } from "../../../src/tools/encoding/query-string-builder";
import { executeTool } from "../../../src/core/executor";

describe("queryStringBuilder", () => {
  it("should have correct metadata", () => {
    expect(queryStringBuilder.meta.id).toBe("encoding/query-string-builder");
  });

  it("should build query string from key=value pairs", async () => {
    const result = await executeTool(queryStringBuilder, {
      input: "key=value\nfoo=bar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("key=value");
      expect(output).toContain("foo=bar");
      expect(output.startsWith("?")).toBe(true);
    }
  });

  it("should support colon-separated pairs", async () => {
    const result = await executeTool(queryStringBuilder, {
      input: "key: value\nfoo: bar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("key=value");
      expect(output).toContain("foo=bar");
    }
  });

  it("should handle option to exclude ?", async () => {
    const result = await executeTool(
      queryStringBuilder,
      { input: "key=value" },
      { includeQuestion: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output.startsWith("?")).toBe(false);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(queryStringBuilder, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should not encode values when encode is false", async () => {
    // Regression: decodeURIComponent doesn't convert + → space; unencoded build must be done manually
    const result = await executeTool(
      queryStringBuilder,
      { input: "name=John Doe\nq=hello world" },
      { encode: false, includeQuestion: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe("name=John Doe&q=hello world");
    }
  });
});
