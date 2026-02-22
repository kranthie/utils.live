import { describe, it, expect } from "vitest";
import { angleConverter } from "../../../src/tools/math/angle-converter";
import { executeTool } from "../../../src/core/executor";

describe("angleConverter", () => {
  it("should have correct metadata", () => {
    expect(angleConverter.meta.id).toBe("math/angle-converter");
    expect(angleConverter.meta.category).toBe("math");
  });

  it("should convert degrees to radians", async () => {
    const result = await executeTool(
      angleConverter,
      { input: "180" },
      { from: "deg", to: "rad" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(Math.PI, 4);
  });

  it("should convert radians to degrees", async () => {
    const result = await executeTool(
      angleConverter,
      { input: String(Math.PI) },
      { from: "rad", to: "deg" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(180, 2);
  });

  it("should convert degrees to gradians", async () => {
    const result = await executeTool(
      angleConverter,
      { input: "90" },
      { from: "deg", to: "grad" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(100, 1);
  });
});
