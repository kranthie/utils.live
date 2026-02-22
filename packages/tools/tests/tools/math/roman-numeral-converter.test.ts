import { describe, it, expect } from "vitest";
import { romanNumeralConverter } from "../../../src/tools/math/roman-numeral-converter";
import { executeTool } from "../../../src/core/executor";

describe("romanNumeralConverter", () => {
  it("should have correct metadata", () => {
    expect(romanNumeralConverter.meta.id).toBe("math/roman-numeral-converter");
  });

  it("should convert decimal to Roman (auto mode)", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("XLII");
    }
  });

  it("should convert Roman to decimal (auto mode)", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "XLII" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("42");
    }
  });

  it("should handle 3999", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "3999" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("MMMCMXCIX");
    }
  });

  it("should handle 1", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("I");
    }
  });

  it("should fail on 0", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "0" });
    expect(result.success).toBe(false);
  });

  it("should fail on number > 3999", async () => {
    const result = await executeTool(romanNumeralConverter, { input: "4000" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid Roman numeral", async () => {
    const result = await executeTool(
      romanNumeralConverter,
      { input: "IIII" },
      { mode: "from-roman" }
    );
    expect(result.success).toBe(false);
  });
});
