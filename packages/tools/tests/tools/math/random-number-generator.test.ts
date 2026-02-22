import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { randomNumberGenerator } from "../../../src/tools/math/random-number-generator";

describe("Random Number Generator", () => {
  it("should have correct metadata", () => {
    expect(randomNumberGenerator.meta.id).toBe("math/random-number-generator");
    expect(randomNumberGenerator.meta.category).toBe("math");
  });

  it("should generate a single integer by default", async () => {
    const result = await executeTool(randomNumberGenerator, {
      min: 1,
      max: 100,
      count: 1,
      integers: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const num = parseInt(data.output as string, 10);
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(100);
    }
  });

  it("should generate multiple numbers", async () => {
    const result = await executeTool(randomNumberGenerator, {
      min: 1,
      max: 10,
      count: 5,
      integers: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const nums = (data.output as string).split(", ").map(Number);
      expect(nums.length).toBe(5);
      nums.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(10);
      });
    }
  });

  it("should generate floating point numbers", async () => {
    const result = await executeTool(randomNumberGenerator, {
      min: 0,
      max: 1,
      count: 3,
      integers: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const nums = (data.output as string).split(", ").map(Number);
      expect(nums.length).toBe(3);
      nums.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      });
    }
  });

  it("should fail when min > max", async () => {
    const result = await executeTool(randomNumberGenerator, {
      min: 100,
      max: 1,
      count: 1,
      integers: true,
    });
    expect(result.success).toBe(false);
  });

  it("should handle min = max", async () => {
    const result = await executeTool(randomNumberGenerator, {
      min: 5,
      max: 5,
      count: 3,
      integers: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const nums = (data.output as string).split(", ").map(Number);
      nums.forEach((n) => {
        expect(n).toBe(5);
      });
    }
  });
});
