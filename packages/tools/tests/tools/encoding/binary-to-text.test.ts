import { describe, it, expect } from "vitest";
import { binaryToText } from "../../../src/tools/encoding/binary-to-text";
import { executeTool } from "../../../src/core/executor";

describe("binaryToText", () => {
  it("should have correct metadata", () => {
    expect(binaryToText.meta.id).toBe("encoding/binary-to-text");
  });

  it("should convert binary to text", async () => {
    const result = await executeTool(binaryToText, {
      input: "01001000 01101001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle binary without spaces", async () => {
    const result = await executeTool(binaryToText, {
      input: "0100100001101001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle empty input", async () => {
    const result = await executeTool(binaryToText, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should fail on non-binary characters", async () => {
    const result = await executeTool(binaryToText, { input: "0102" });
    expect(result.success).toBe(false);
  });

  it("should fail on incomplete bytes", async () => {
    const result = await executeTool(binaryToText, { input: "0100" });
    expect(result.success).toBe(false);
  });
});
