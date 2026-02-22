import { describe, it, expect } from "vitest";
import { utf16ToUtf8 } from "../../../src/tools/encoding/utf16-to-utf8";
import { executeTool } from "../../../src/core/executor";

describe("utf16ToUtf8", () => {
  it("should have correct metadata", () => {
    expect(utf16ToUtf8.meta.id).toBe("encoding/utf16-to-utf8");
  });

  it("should show size comparison for ASCII", async () => {
    const result = await executeTool(utf16ToUtf8, { input: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Size Comparison");
      expect(output).toContain("UTF-16 size:");
      expect(output).toContain("UTF-8 size:");
    }
  });

  it("should show UTF-16 code units", async () => {
    const result = await executeTool(utf16ToUtf8, { input: "A" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("0041");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(utf16ToUtf8, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toContain("empty");
    }
  });
});
