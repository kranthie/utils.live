import { describe, it, expect } from "vitest";
import { jsonEscape } from "../../../src/tools/encoding/json-escape";
import { executeTool } from "../../../src/core/executor";

describe("jsonEscape", () => {
  it("should have correct metadata", () => {
    expect(jsonEscape.meta.id).toBe("encoding/json-escape");
  });

  it("should escape quotes", async () => {
    const result = await executeTool(jsonEscape, { input: 'He said "hello"' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        'He said \\"hello\\"'
      );
    }
  });

  it("should escape newlines", async () => {
    const result = await executeTool(jsonEscape, { input: "line1\nline2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("line1\\nline2");
    }
  });

  it("should escape backslashes", async () => {
    const result = await executeTool(jsonEscape, { input: "path\\file" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("path\\\\file");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(jsonEscape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });
});
