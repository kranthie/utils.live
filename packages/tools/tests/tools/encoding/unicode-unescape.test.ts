import { describe, it, expect } from "vitest";
import { unicodeUnescape } from "../../../src/tools/encoding/unicode-unescape";
import { executeTool } from "../../../src/core/executor";

describe("unicodeUnescape", () => {
  it("should have correct metadata", () => {
    expect(unicodeUnescape.meta.id).toBe("encoding/unicode-unescape");
  });

  it("should unescape \\uXXXX notation", async () => {
    const result = await executeTool(unicodeUnescape, {
      input: "\\u0048\\u0069",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should unescape \\u{XXXXX} notation", async () => {
    const result = await executeTool(unicodeUnescape, { input: "\\u{1F30D}" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("🌍");
    }
  });

  it("should handle mixed content", async () => {
    const result = await executeTool(unicodeUnescape, {
      input: "Hello \\u4E16\\u754C",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello 世界");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(unicodeUnescape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should pass through text without escapes", async () => {
    const result = await executeTool(unicodeUnescape, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("hello");
    }
  });
});
