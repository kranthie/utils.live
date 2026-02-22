import { describe, it, expect } from "vitest";
import { numberFormatter } from "../../../src/tools/math/number-formatter";
import { executeTool } from "../../../src/core/executor";

describe("numberFormatter", () => {
  it("should have correct metadata", () => {
    expect(numberFormatter.meta.id).toBe("math/number-formatter");
    expect(numberFormatter.meta.category).toBe("math");
  });

  it("should format number with commas", async () => {
    const result = await executeTool(numberFormatter, { input: "1234567.89" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain(
        "1,234,567"
      );
  });

  it("should handle negative numbers", async () => {
    const result = await executeTool(numberFormatter, { input: "-9876543" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("-");
  });

  it("should reject non-numeric input", async () => {
    const result = await executeTool(numberFormatter, { input: "hello" });
    expect(result.success).toBe(false);
  });
});
