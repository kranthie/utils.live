import { describe, it, expect } from "vitest";
import { speedConverter } from "../../../src/tools/math/speed-converter";
import { executeTool } from "../../../src/core/executor";

describe("speedConverter", () => {
  it("should have correct metadata", () => {
    expect(speedConverter.meta.id).toBe("math/speed-converter");
    expect(speedConverter.meta.category).toBe("math");
  });

  it("should convert km/h to mph", async () => {
    const result = await executeTool(
      speedConverter,
      { input: "100" },
      { from: "kmh", to: "mph" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(62.1371, 2);
  });

  it("should convert m/s to km/h", async () => {
    const result = await executeTool(
      speedConverter,
      { input: "1" },
      { from: "ms", to: "kmh" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(3.6, 1);
  });

  it("should convert knots to mph", async () => {
    const result = await executeTool(
      speedConverter,
      { input: "1" },
      { from: "kn", to: "mph" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1.15078, 3);
  });
});
