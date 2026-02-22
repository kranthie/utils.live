import { describe, it, expect } from "vitest";
import { urlEncode } from "../../../src/tools/encoding/url-encode";
import { executeTool } from "../../../src/core/executor";

describe("urlEncode", () => {
  it("should have correct metadata", () => {
    expect(urlEncode.meta.id).toBe("encoding/url-encode");
  });

  it("should encode special characters", async () => {
    const result = await executeTool(urlEncode, {
      input: "hello world&foo=bar",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "hello%20world%26foo%3Dbar"
      );
    }
  });

  it("should not encode unreserved characters", async () => {
    const result = await executeTool(urlEncode, { input: "abc123-_.~" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("abc123-_.~");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(urlEncode, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should encode unicode characters", async () => {
    const result = await executeTool(urlEncode, { input: "日本語" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("%");
    }
  });
});
