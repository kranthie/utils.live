import { describe, it, expect } from "vitest";
import { volumeConverter } from "../../../src/tools/math/volume-converter";
import { executeTool } from "../../../src/core/executor";

describe("volumeConverter", () => {
  it("should have correct metadata", () => {
    expect(volumeConverter.meta.id).toBe("math/volume-converter");
    expect(volumeConverter.meta.category).toBe("math");
  });

  it("should convert liters to gallons", async () => {
    const result = await executeTool(
      volumeConverter,
      { input: "3.78541" },
      { from: "L", to: "gal" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 2);
  });

  it("should convert mL to cups", async () => {
    const result = await executeTool(
      volumeConverter,
      { input: "236.588" },
      { from: "mL", to: "cup" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 1);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      volumeConverter,
      { input: "xyz" },
      { from: "L", to: "mL" }
    );
    expect(result.success).toBe(false);
  });
});
