import { describe, it, expect } from "vitest";
import { latin1Converter } from "../../../src/tools/encoding/latin1-converter";
import { executeTool } from "../../../src/core/executor";

describe("latin1Converter", () => {
  it("should have correct metadata", () => {
    expect(latin1Converter.meta.id).toBe("encoding/latin1-converter");
  });

  it("should convert text to Latin-1 bytes", async () => {
    const result = await executeTool(
      latin1Converter,
      { input: "Hi" },
      { mode: "to-bytes" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("48");
      expect(output).toContain("69");
    }
  });

  it("should convert bytes to text", async () => {
    const result = await executeTool(
      latin1Converter,
      { input: "72 105" },
      { mode: "from-bytes" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle hex bytes in from-bytes mode", async () => {
    const result = await executeTool(
      latin1Converter,
      { input: "0x48 0x69" },
      { mode: "from-bytes" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should warn about non-Latin-1 characters", async () => {
    const result = await executeTool(
      latin1Converter,
      { input: "日本" },
      { mode: "to-bytes" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("NOT in Latin-1");
    }
  });

  it("should fail on out-of-range byte values", async () => {
    const result = await executeTool(
      latin1Converter,
      { input: "300" },
      { mode: "from-bytes" }
    );
    expect(result.success).toBe(false);
  });
});
