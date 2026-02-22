import { describe, it, expect } from "vitest";
import { urlParser } from "../../../src/tools/encoding/url-parser";
import { executeTool } from "../../../src/core/executor";

describe("urlParser", () => {
  it("should have correct metadata", () => {
    expect(urlParser.meta.id).toBe("encoding/url-parser");
  });

  it("should parse a full URL", async () => {
    const result = await executeTool(urlParser, {
      input: "https://example.com:8080/path?key=value&foo=bar#section",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("protocol: https:");
      expect(output).toContain("hostname: example.com");
      expect(output).toContain("port: 8080");
      expect(output).toContain("pathname: /path");
      expect(output).toContain("key: value");
      expect(output).toContain("foo: bar");
    }
  });

  it("should parse simple URL", async () => {
    const result = await executeTool(urlParser, {
      input: "https://google.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("hostname: google.com");
    }
  });

  it("should fail on invalid URL", async () => {
    const result = await executeTool(urlParser, { input: "not a url" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(urlParser, { input: "" });
    expect(result.success).toBe(false);
  });
});
