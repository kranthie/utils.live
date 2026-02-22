import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { bitwiseCalculator } from "../../../src/tools/math/bitwise-calculator";

describe("Bitwise Calculator", () => {
  it("should have correct metadata", () => {
    expect(bitwiseCalculator.meta.id).toBe("math/bitwise-calculator");
    expect(bitwiseCalculator.meta.category).toBe("math");
  });

  it("should perform AND operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "12, 10" },
      { operation: "AND", shiftAmount: 1 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // 12 & 10 = 8
      expect((data.output as string)).toContain("12 AND 10 = 8");
    }
  });

  it("should perform OR operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "12, 10" },
      { operation: "OR", shiftAmount: 1 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // 12 | 10 = 14
      expect((data.output as string)).toContain("12 OR 10 = 14");
    }
  });

  it("should perform XOR operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "12, 10" },
      { operation: "XOR", shiftAmount: 1 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // 12 ^ 10 = 6
      expect((data.output as string)).toContain("12 XOR 10 = 6");
    }
  });

  it("should perform NOT operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "255" },
      { operation: "NOT", shiftAmount: 1 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // ~255 = -256
      expect((data.output as string)).toContain("NOT 255 = -256");
    }
  });

  it("should perform LSHIFT operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "1" },
      { operation: "LSHIFT", shiftAmount: 3 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // 1 << 3 = 8
      expect((data.output as string)).toContain("1 << 3 = 8");
    }
  });

  it("should perform RSHIFT operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "16" },
      { operation: "RSHIFT", shiftAmount: 2 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // 16 >> 2 = 4
      expect((data.output as string)).toContain("16 >> 2 = 4");
    }
  });

  it("should show binary and hex representations", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "12, 10" },
      { operation: "AND", shiftAmount: 1 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Binary:");
      expect((data.output as string)).toContain("Hex:");
      expect((data.output as string)).toContain("Octal:");
    }
  });

  it("should fail on invalid integer", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "abc" },
      { operation: "AND", shiftAmount: 1 }
    );
    expect(result.success).toBe(false);
  });

  it("should fail on single number for binary operation", async () => {
    const result = await executeTool(
      bitwiseCalculator,
      { input: "5" },
      { operation: "AND", shiftAmount: 1 }
    );
    expect(result.success).toBe(false);
  });
});
