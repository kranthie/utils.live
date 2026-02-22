import { describe, it, expect } from "vitest";
import { energyConverter } from "../../../src/tools/math/energy-converter";
import { executeTool } from "../../../src/core/executor";

describe("energyConverter", () => {
  it("should have correct metadata", () => {
    expect(energyConverter.meta.id).toBe("math/energy-converter");
    expect(energyConverter.meta.category).toBe("math");
  });

  it("should convert kJ to kcal", async () => {
    const result = await executeTool(
      energyConverter,
      { input: "4.184" },
      { from: "kJ", to: "kcal" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 2);
  });

  it("should convert J to kWh", async () => {
    const result = await executeTool(
      energyConverter,
      { input: "3600000" },
      { from: "J", to: "kWh" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 2);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      energyConverter,
      { input: "abc" },
      { from: "J", to: "kJ" }
    );
    expect(result.success).toBe(false);
  });
});
