import { describe, it, expect } from "vitest";
import { punycodeEncode } from "../../../src/tools/encoding/punycode-encode";
import { executeTool } from "../../../src/core/executor";

describe("punycodeEncode", () => {
  it("should have correct metadata", () => {
    expect(punycodeEncode.meta.id).toBe("encoding/punycode-encode");
  });

  it("should encode a unicode domain", async () => {
    const result = await executeTool(punycodeEncode, { input: "münchen.de" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("xn--");
      expect(output).toContain(".de");
    }
  });

  it("should pass through pure ASCII domain labels", async () => {
    const result = await executeTool(punycodeEncode, { input: "example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("example.com");
    }
  });

  it("should encode single label", async () => {
    const result = await executeTool(punycodeEncode, { input: "München" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output.startsWith("xn--")).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(punycodeEncode, { input: "" });
    expect(result.success).toBe(false);
  });
});
