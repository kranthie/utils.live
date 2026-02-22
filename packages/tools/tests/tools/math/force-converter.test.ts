import { describe, it, expect } from "vitest";
import { forceConverter } from "../../../src/tools/math/force-converter";
import { executeTool } from "../../../src/core/executor";

describe("forceConverter", () => {
  it("should have correct metadata", () => {
    expect(forceConverter.meta.id).toBe("math/force-converter");
    expect(forceConverter.meta.category).toBe("math");
  });

  it("should convert N to lbf", async () => {
    const result = await executeTool(
      forceConverter,
      { input: "1" },
      { from: "N", to: "lbf" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(0.224809, 3);
  });

  it("should convert kN to N", async () => {
    const result = await executeTool(
      forceConverter,
      { input: "1" },
      { from: "kN", to: "N" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      forceConverter,
      { input: "xyz" },
      { from: "N", to: "lbf" }
    );
    expect(result.success).toBe(false);
  });
});
