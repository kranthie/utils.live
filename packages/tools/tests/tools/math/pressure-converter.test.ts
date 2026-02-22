import { describe, it, expect } from "vitest";
import { pressureConverter } from "../../../src/tools/math/pressure-converter";
import { executeTool } from "../../../src/core/executor";

describe("pressureConverter", () => {
  it("should have correct metadata", () => {
    expect(pressureConverter.meta.id).toBe("math/pressure-converter");
    expect(pressureConverter.meta.category).toBe("math");
  });

  it("should convert atm to Pa", async () => {
    const result = await executeTool(
      pressureConverter,
      { input: "1" },
      { from: "atm", to: "Pa" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(101325, 0);
  });

  it("should convert bar to psi", async () => {
    const result = await executeTool(
      pressureConverter,
      { input: "1" },
      { from: "bar", to: "psi" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(14.5038, 2);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      pressureConverter,
      { input: "abc" },
      { from: "atm", to: "Pa" }
    );
    expect(result.success).toBe(false);
  });
});
