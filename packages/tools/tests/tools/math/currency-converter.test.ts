import { describe, it, expect } from "vitest";
import { currencyConverter } from "../../../src/tools/math/currency-converter";
import { executeTool } from "../../../src/core/executor";

describe("currencyConverter", () => {
  it("should have correct metadata", () => {
    expect(currencyConverter.meta.id).toBe("math/currency-converter");
    expect(currencyConverter.meta.category).toBe("math");
  });

  it("should convert USD to EUR", async () => {
    const result = await executeTool(
      currencyConverter,
      { input: "100" },
      { from: "USD", to: "EUR" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "92.59"
      );
  });

  it("should convert same currency to same amount", async () => {
    const result = await executeTool(
      currencyConverter,
      { input: "50" },
      { from: "USD", to: "USD" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(50, 1);
  });

  it("should reject non-numeric input", async () => {
    const result = await executeTool(
      currencyConverter,
      { input: "abc" },
      { from: "USD", to: "EUR" }
    );
    expect(result.success).toBe(false);
  });
});
