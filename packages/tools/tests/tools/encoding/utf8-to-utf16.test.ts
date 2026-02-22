import { describe, it, expect } from "vitest";
import { utf8ToUtf16 } from "../../../src/tools/encoding/utf8-to-utf16";
import { executeTool } from "../../../src/core/executor";

describe("utf8ToUtf16", () => {
  it("should have correct metadata", () => {
    expect(utf8ToUtf16.meta.id).toBe("encoding/utf8-to-utf16");
  });

  it("should show UTF-8 and UTF-16 for ASCII", async () => {
    const result = await executeTool(utf8ToUtf16, { input: "Hi" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("UTF-8 Bytes");
      expect(output).toContain("UTF-16 Code Units");
      expect(output).toContain("48");
    }
  });

  it("should show character details for emoji", async () => {
    const result = await executeTool(utf8ToUtf16, { input: "🌍" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Character Details");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(utf8ToUtf16, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toContain("empty");
    }
  });
});
