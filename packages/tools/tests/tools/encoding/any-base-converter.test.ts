import { describe, it, expect } from "vitest";
import { anyBaseConverter } from "../../../src/tools/encoding/any-base-converter";
import { executeTool } from "../../../src/core/executor";

describe("anyBaseConverter", () => {
  it("should have correct metadata", () => {
    expect(anyBaseConverter.meta.id).toBe("encoding/any-base-converter");
  });

  it("should convert decimal to hex (default)", async () => {
    const result = await executeTool(anyBaseConverter, { input: "255" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("FF");
    }
  });

  it("should convert binary to decimal", async () => {
    const result = await executeTool(
      anyBaseConverter,
      { input: "1010" },
      { fromBase: 2, toBase: 10 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("10");
    }
  });

  it("should convert hex to octal", async () => {
    const result = await executeTool(
      anyBaseConverter,
      { input: "FF" },
      { fromBase: 16, toBase: 8 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("377");
    }
  });

  it("should handle base 36", async () => {
    const result = await executeTool(
      anyBaseConverter,
      { input: "Z" },
      { fromBase: 36, toBase: 10 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("35");
    }
  });

  it("should fail on invalid digit for base", async () => {
    const result = await executeTool(
      anyBaseConverter,
      { input: "9" },
      { fromBase: 8, toBase: 10 }
    );
    expect(result.success).toBe(false);
  });

  it("should handle zero", async () => {
    const result = await executeTool(
      anyBaseConverter,
      { input: "0" },
      { fromBase: 10, toBase: 2 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("0");
    }
  });
});
