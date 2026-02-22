import { describe, it, expect } from "vitest";
import { powerConverter } from "../../../src/tools/math/power-converter";
import { executeTool } from "../../../src/core/executor";

describe("powerConverter", () => {
  it("should have correct metadata", () => {
    expect(powerConverter.meta.id).toBe("math/power-converter");
    expect(powerConverter.meta.category).toBe("math");
  });

  it("should convert kW to hp", async () => {
    const result = await executeTool(
      powerConverter,
      { input: "1" },
      { from: "kW", to: "hp" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1.34102, 3);
  });

  it("should convert W to kW", async () => {
    const result = await executeTool(
      powerConverter,
      { input: "1000" },
      { from: "W", to: "kW" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1, 2);
  });

  it("should reject invalid input", async () => {
    const result = await executeTool(
      powerConverter,
      { input: "not-a-number" },
      { from: "W", to: "kW" }
    );
    expect(result.success).toBe(false);
  });
});
