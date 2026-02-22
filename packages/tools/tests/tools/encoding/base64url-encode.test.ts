import { describe, it, expect } from "vitest";
import { base64urlEncode } from "../../../src/tools/encoding/base64url-encode";
import { executeTool } from "../../../src/core/executor";

describe("base64urlEncode", () => {
  it("should have correct tool metadata", () => {
    expect(base64urlEncode.meta.id).toBe("encoding/base64url-encode");
    expect(base64urlEncode.meta.category).toBe("encoding");
  });

  it("should encode simple text to URL-safe base64", async () => {
    const result = await executeTool(base64urlEncode, {
      input: "Hello, World!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "SGVsbG8sIFdvcmxkIQ"
      );
    }
  });

  it("should not contain +, /, or = characters", async () => {
    const result = await executeTool(base64urlEncode, { input: ">>>???" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).not.toContain("+");
      expect(output).not.toContain("/");
      expect(output).not.toContain("=");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(base64urlEncode, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should handle UTF-8 characters", async () => {
    const result = await executeTool(base64urlEncode, { input: "Hello 🌍" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).not.toContain("+");
      expect(output).not.toContain("/");
      expect(output).not.toContain("=");
    }
  });
});
