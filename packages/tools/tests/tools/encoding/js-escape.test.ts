import { describe, it, expect } from "vitest";
import { jsEscape } from "../../../src/tools/encoding/js-escape";
import { executeTool } from "../../../src/core/executor";

describe("jsEscape", () => {
  it("should have correct metadata", () => {
    expect(jsEscape.meta.id).toBe("encoding/js-escape");
  });

  it("should escape quotes", async () => {
    const result = await executeTool(jsEscape, { input: 'He said "hello"' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toContain(
        '\\"hello\\"'
      );
    }
  });

  it("should escape newlines and tabs", async () => {
    const result = await executeTool(jsEscape, { input: "line1\nline2\ttab" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("\\n");
      expect(output).toContain("\\t");
    }
  });

  it("should escape backslashes", async () => {
    const result = await executeTool(jsEscape, { input: "path\\to\\file" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "path\\\\to\\\\file"
      );
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(jsEscape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should escape non-ASCII characters", async () => {
    const result = await executeTool(jsEscape, { input: "Hello 世界" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("\\u");
    }
  });
});
