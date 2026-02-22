import { describe, it, expect } from "vitest";
import { markupCalculator } from "../../../src/tools/math/markup-calculator";
import { executeTool } from "../../../src/core/executor";

describe("markupCalculator", () => {
  it("should have correct metadata", () => {
    expect(markupCalculator.meta.id).toBe("math/markup-calculator");
    expect(markupCalculator.meta.category).toBe("math");
  });

  it("should calculate markup", async () => {
    const result = await executeTool(markupCalculator, {
      cost: 100,
      markupPercent: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "$150.00"
      );
    }
  });

  it("should handle zero markup", async () => {
    const result = await executeTool(markupCalculator, {
      cost: 100,
      markupPercent: 0,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$100.00"
      );
  });

  it("should handle large markup", async () => {
    const result = await executeTool(markupCalculator, {
      cost: 50,
      markupPercent: 200,
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "$150.00"
      );
  });
});
