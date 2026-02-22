import { describe, it, expect } from "vitest";
import { textToBinary } from "../../../src/tools/encoding/text-to-binary";
import { executeTool } from "../../../src/core/executor";

describe("textToBinary", () => {
  it("should have correct metadata", () => {
    expect(textToBinary.meta.id).toBe("encoding/text-to-binary");
  });

  it("should convert text to binary", async () => {
    const result = await executeTool(textToBinary, { input: "Hi" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "01001000 01101001"
      );
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(textToBinary, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should support custom separator", async () => {
    const result = await executeTool(
      textToBinary,
      { input: "Hi" },
      { separator: "-" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(
        "01001000-01101001"
      );
    }
  });

  it("should handle single character", async () => {
    const result = await executeTool(textToBinary, { input: "A" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("01000001");
    }
  });
});
