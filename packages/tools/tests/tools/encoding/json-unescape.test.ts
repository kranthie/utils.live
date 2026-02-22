import { describe, it, expect } from "vitest";
import { jsonUnescape } from "../../../src/tools/encoding/json-unescape";
import { executeTool } from "../../../src/core/executor";

describe("jsonUnescape", () => {
  it("should have correct metadata", () => {
    expect(jsonUnescape.meta.id).toBe("encoding/json-unescape");
  });

  it("should unescape quotes", async () => {
    const result = await executeTool(jsonUnescape, {
      input: 'He said \\"hello\\"',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        'He said "hello"'
      );
    }
  });

  it("should unescape newlines", async () => {
    const result = await executeTool(jsonUnescape, { input: "line1\\nline2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("line1\nline2");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(jsonUnescape, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should fail on invalid escape sequence", async () => {
    const result = await executeTool(jsonUnescape, { input: "bad \\x escape" });
    expect(result.success).toBe(false);
  });
});
