import { describe, it, expect } from "vitest";
import { percentageChange } from "../../../src/tools/math/percentage-change";
import { executeTool } from "../../../src/core/executor";

describe("percentageChange", () => {
  it("should have correct metadata", () => {
    expect(percentageChange.meta.id).toBe("math/percentage-change");
    expect(percentageChange.meta.category).toBe("math");
  });

  it("should calculate increase", async () => {
    const result = await executeTool(percentageChange, { input: "100, 150" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "50.00%"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "increase"
      );
    }
  });

  it("should calculate decrease", async () => {
    const result = await executeTool(percentageChange, { input: "200, 100" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "50.00%"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "decrease"
      );
    }
  });

  it("should reject zero old value", async () => {
    const result = await executeTool(percentageChange, { input: "0, 100" });
    expect(result.success).toBe(false);
  });
});
