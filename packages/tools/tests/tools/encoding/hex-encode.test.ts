import { describe, it, expect } from "vitest";
import { hexEncode } from "../../../src/tools/encoding/hex-encode";
import { executeTool } from "../../../src/core/executor";

describe("hexEncode", () => {
  it("should have correct metadata", () => {
    expect(hexEncode.meta.id).toBe("encoding/hex-encode");
  });

  it("should encode text to hex", async () => {
    const result = await executeTool(hexEncode, { input: "Hi" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("4869");
    }
  });

  it("should support uppercase option", async () => {
    const result = await executeTool(
      hexEncode,
      { input: "Hi" },
      { uppercase: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("4869");
    }
  });

  it("should support separator option", async () => {
    const result = await executeTool(
      hexEncode,
      { input: "Hi" },
      { separator: " " }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("48 69");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(hexEncode, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should handle colon separator", async () => {
    const result = await executeTool(
      hexEncode,
      { input: "AB" },
      { separator: ":", uppercase: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("41:42");
    }
  });
});
