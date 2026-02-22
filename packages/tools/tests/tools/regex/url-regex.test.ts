import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { urlRegex } from "../../../src/tools/regex/url-regex";

describe("URL Regex", () => {
  it("should return any URL pattern by default", async () => {
    const result = await executeTool(urlRegex, { type: "any" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp(
        (result.data as Record<string, unknown>).pattern
      );
      expect(regex.test("https://example.com")).toBe(true);
      expect(regex.test("http://test.org/path")).toBe(true);
    }
  });

  it("should return HTTPS-only pattern", async () => {
    const result = await executeTool(urlRegex, { type: "https" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp(
        (result.data as Record<string, unknown>).pattern
      );
      expect(regex.test("https://example.com")).toBe(true);
      expect(regex.test("http://example.com")).toBe(false);
    }
  });

  it("should return FTP pattern", async () => {
    const result = await executeTool(urlRegex, { type: "ftp" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp(
        (result.data as Record<string, unknown>).pattern
      );
      expect(regex.test("ftp://files.example.com")).toBe(true);
    }
  });
});
