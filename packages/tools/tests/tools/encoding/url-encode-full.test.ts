import { describe, it, expect } from "vitest";
import { urlEncodeFull } from "../../../src/tools/encoding/url-encode-full";
import { executeTool } from "../../../src/core/executor";

describe("urlEncodeFull", () => {
  it("should have correct metadata", () => {
    expect(urlEncodeFull.meta.id).toBe("encoding/url-encode-full");
  });

  it("should encode ALL characters", async () => {
    const result = await executeTool(urlEncodeFull, { input: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("%61%62%63");
    }
  });

  it("should encode numbers too", async () => {
    const result = await executeTool(urlEncodeFull, { input: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("%31%32%33");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(urlEncodeFull, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should encode space as %20", async () => {
    const result = await executeTool(urlEncodeFull, { input: " " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("%20");
    }
  });
});
