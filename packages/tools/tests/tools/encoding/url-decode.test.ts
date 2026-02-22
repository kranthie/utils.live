import { describe, it, expect } from "vitest";
import { urlDecode } from "../../../src/tools/encoding/url-decode";
import { executeTool } from "../../../src/core/executor";

describe("urlDecode", () => {
  it("should have correct metadata", () => {
    expect(urlDecode.meta.id).toBe("encoding/url-decode");
  });

  it("should decode percent encoding", async () => {
    const result = await executeTool(urlDecode, {
      input: "hello%20world%26foo%3Dbar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "hello world&foo=bar"
      );
    }
  });

  it("should handle plus signs as spaces", async () => {
    // decodeURIComponent doesn't convert + to space (that's form encoding)
    const result = await executeTool(urlDecode, { input: "hello+world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("hello+world");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(urlDecode, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should fail on malformed percent encoding", async () => {
    const result = await executeTool(urlDecode, { input: "%ZZ" });
    expect(result.success).toBe(false);
  });

  it("should handle already-decoded text", async () => {
    const result = await executeTool(urlDecode, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("hello");
    }
  });
});
