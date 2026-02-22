import { describe, it, expect } from "vitest";
import { unicodeEscape } from "../../../src/tools/encoding/unicode-escape";
import { executeTool } from "../../../src/core/executor";

describe("unicodeEscape", () => {
  it("should have correct metadata", () => {
    expect(unicodeEscape.meta.id).toBe("encoding/unicode-escape");
  });

  it("should escape non-ASCII characters", async () => {
    const result = await executeTool(unicodeEscape, { input: "Hello 世界" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Hello ");
      expect(output).toContain("\\u4E16");
      expect(output).toContain("\\u754C");
    }
  });

  it("should escape all when option set", async () => {
    const result = await executeTool(
      unicodeEscape,
      { input: "Hi" },
      { escapeAll: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe("\\u0048\\u0069");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(unicodeEscape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should handle emojis with curly brace notation", async () => {
    const result = await executeTool(unicodeEscape, { input: "🌍" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("\\u{");
    }
  });
});
