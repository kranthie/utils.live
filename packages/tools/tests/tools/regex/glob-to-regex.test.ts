import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { globToRegex } from "../../../src/tools/regex/glob-to-regex";

describe("Glob to Regex", () => {
  it("should convert simple wildcard", async () => {
    const result = await executeTool(globToRegex, { input: "*.js" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp((result.data as Record<string, unknown>).output);
      expect(regex.test("app.js")).toBe(true);
      expect(regex.test("test.ts")).toBe(false);
    }
  });

  it("should convert double-star glob", async () => {
    const result = await executeTool(globToRegex, { input: "**/*.ts" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp((result.data as Record<string, unknown>).output);
      expect(regex.test("src/foo.ts")).toBe(true);
      expect(regex.test("foo.ts")).toBe(true);
    }
  });

  it("should convert brace alternatives", async () => {
    const result = await executeTool(globToRegex, { input: "*.{js,ts}" });
    expect(result.success).toBe(true);
    if (result.success) {
      const regex = new RegExp((result.data as Record<string, unknown>).output);
      expect(regex.test("app.js")).toBe(true);
      expect(regex.test("app.ts")).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(globToRegex, { input: "" });
    expect(result.success).toBe(false);
  });
});
