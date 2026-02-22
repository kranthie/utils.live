import { describe, it, expect } from "vitest";
import { queryStringParser } from "../../../src/tools/encoding/query-string-parser";
import { executeTool } from "../../../src/core/executor";

describe("queryStringParser", () => {
  it("should have correct metadata", () => {
    expect(queryStringParser.meta.id).toBe("encoding/query-string-parser");
  });

  it("should parse query string", async () => {
    const result = await executeTool(queryStringParser, {
      input: "key=value&foo=bar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("key = value");
      expect(output).toContain("foo = bar");
    }
  });

  it("should handle leading ?", async () => {
    const result = await executeTool(queryStringParser, {
      input: "?key=value",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toContain(
        "key = value"
      );
    }
  });

  it("should parse from full URL", async () => {
    const result = await executeTool(queryStringParser, {
      input: "https://example.com/path?a=1&b=2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("a = 1");
      expect(output).toContain("b = 2");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(queryStringParser, { input: "" });
    expect(result.success).toBe(false);
  });
});
