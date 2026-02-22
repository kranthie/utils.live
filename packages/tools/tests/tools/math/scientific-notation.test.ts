import { describe, it, expect } from "vitest";
import { scientificNotation } from "../../../src/tools/math/scientific-notation";
import { executeTool } from "../../../src/core/executor";

describe("scientificNotation", () => {
  it("should have correct metadata", () => {
    expect(scientificNotation.meta.id).toBe("math/scientific-notation");
  });

  it("should convert to scientific notation", async () => {
    const result = await executeTool(scientificNotation, { input: "123456" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("e+");
      expect(output).toContain("1.23456");
    }
  });

  it("should convert from scientific notation to standard", async () => {
    const result = await executeTool(scientificNotation, { input: "1.5e3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("1500");
    }
  });

  it("should handle small numbers", async () => {
    const result = await executeTool(scientificNotation, { input: "0.001" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("e-");
    }
  });

  it("should handle negative exponents in scientific", async () => {
    const result = await executeTool(scientificNotation, { input: "5e-4" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toContain("0.0005");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(scientificNotation, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-numeric input", async () => {
    const result = await executeTool(scientificNotation, { input: "abc" });
    expect(result.success).toBe(false);
  });
});
