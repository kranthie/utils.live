import { describe, it, expect } from "vitest";
import { areaConverter } from "../../../src/tools/math/area-converter";
import { executeTool } from "../../../src/core/executor";

describe("areaConverter", () => {
  it("should have correct metadata", () => {
    expect(areaConverter.meta.id).toBe("math/area-converter");
    expect(areaConverter.meta.category).toBe("math");
  });

  it("should convert square meters to square feet", async () => {
    const result = await executeTool(
      areaConverter,
      { input: "1" },
      { from: "sqm", to: "sqft" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(10.7639, 2);
  });

  it("should convert acres to hectares", async () => {
    const result = await executeTool(
      areaConverter,
      { input: "1" },
      { from: "acre", to: "ha" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(0.404686, 3);
  });

  it("should reject non-numeric input", async () => {
    const result = await executeTool(
      areaConverter,
      { input: "abc" },
      { from: "sqm", to: "sqft" }
    );
    expect(result.success).toBe(false);
  });
});
