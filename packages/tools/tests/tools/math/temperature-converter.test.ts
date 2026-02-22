import { describe, it, expect } from "vitest";
import { temperatureConverter } from "../../../src/tools/math/temperature-converter";
import { executeTool } from "../../../src/core/executor";

describe("temperatureConverter", () => {
  it("should have correct metadata", () => {
    expect(temperatureConverter.meta.id).toBe("math/temperature-converter");
    expect(temperatureConverter.meta.category).toBe("math");
  });

  it("should convert Celsius to Fahrenheit", async () => {
    const result = await executeTool(
      temperatureConverter,
      { input: "100" },
      { from: "C", to: "F" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(212, 1);
  });

  it("should convert Fahrenheit to Celsius", async () => {
    const result = await executeTool(
      temperatureConverter,
      { input: "32" },
      { from: "F", to: "C" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(0, 1);
  });

  it("should convert Celsius to Kelvin", async () => {
    const result = await executeTool(
      temperatureConverter,
      { input: "0" },
      { from: "C", to: "K" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(273.15, 1);
  });

  it("should handle negative temperatures", async () => {
    const result = await executeTool(
      temperatureConverter,
      { input: "-40" },
      { from: "C", to: "F" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(-40, 1);
  });
});
