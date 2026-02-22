import { describe, it, expect } from "vitest";
import { vatCalculator } from "../../../src/tools/math/vat-calculator";
import { executeTool } from "../../../src/core/executor";

describe("vatCalculator", () => {
  it("should have correct metadata", () => {
    expect(vatCalculator.meta.id).toBe("math/vat-calculator");
    expect(vatCalculator.meta.category).toBe("math");
  });

  it("should calculate VAT", async () => {
    const result = await executeTool(vatCalculator, { amount: 100, rate: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "$20.00"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "$120.00"
      );
    }
  });

  it("should handle zero VAT rate", async () => {
    const result = await executeTool(vatCalculator, { amount: 100, rate: 0 });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$100.00"
      );
  });

  it("should calculate with default values", async () => {
    const result = await executeTool(vatCalculator, {});
    expect(result.success).toBe(true);
  });
});
