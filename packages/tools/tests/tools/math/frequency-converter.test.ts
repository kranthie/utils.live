import { describe, it, expect } from "vitest";
import { frequencyConverter } from "../../../src/tools/math/frequency-converter";
import { executeTool } from "../../../src/core/executor";

describe("frequencyConverter", () => {
  it("should have correct metadata", () => {
    expect(frequencyConverter.meta.id).toBe("math/frequency-converter");
    expect(frequencyConverter.meta.category).toBe("math");
  });

  it("should convert GHz to MHz", async () => {
    const result = await executeTool(
      frequencyConverter,
      { input: "1" },
      { from: "GHz", to: "MHz" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });

  it("should convert kHz to Hz", async () => {
    const result = await executeTool(
      frequencyConverter,
      { input: "1" },
      { from: "kHz", to: "Hz" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      frequencyConverter,
      { input: "abc" },
      { from: "Hz", to: "kHz" }
    );
    expect(result.success).toBe(false);
  });
});
