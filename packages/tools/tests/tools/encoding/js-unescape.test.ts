import { describe, it, expect } from "vitest";
import { jsUnescape } from "../../../src/tools/encoding/js-unescape";
import { executeTool } from "../../../src/core/executor";

describe("jsUnescape", () => {
  it("should have correct metadata", () => {
    expect(jsUnescape.meta.id).toBe("encoding/js-unescape");
  });

  it("should unescape common sequences", async () => {
    const result = await executeTool(jsUnescape, {
      input: "line1\\nline2\\ttab",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "line1\nline2\ttab"
      );
    }
  });

  it("should unescape backslashes", async () => {
    const result = await executeTool(jsUnescape, {
      input: "path\\\\to\\\\file",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("path\\to\\file");
    }
  });

  it("should unescape unicode sequences", async () => {
    const result = await executeTool(jsUnescape, {
      input: "\\u0048\\u0065\\u006c\\u006c\\u006f",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should unescape hex sequences", async () => {
    const result = await executeTool(jsUnescape, { input: "\\x48\\x69" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(jsUnescape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });
});
