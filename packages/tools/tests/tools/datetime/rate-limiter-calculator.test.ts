import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { rateLimiterCalculator } from "../../../src/tools/datetime/rate-limiter-calculator";

describe("Rate Limiter Calculator", () => {
  it("should have correct metadata", () => {
    expect(rateLimiterCalculator.meta.id).toBe(
      "datetime/rate-limiter-calculator"
    );
    expect(rateLimiterCalculator.meta.category).toBe("datetime");
  });

  it("should calculate rates for 100 requests per 60 seconds", async () => {
    const result = await executeTool(rateLimiterCalculator, {
      requests: 100,
      windowSeconds: 60,
      burstSize: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("1.67 requests/second");
      expect(output).toContain("100.00 requests/minute");
      expect(output).toContain("Bucket size: 10");
    }
  });

  it("should calculate for 1 request per second", async () => {
    const result = await executeTool(rateLimiterCalculator, {
      requests: 1,
      windowSeconds: 1,
      burstSize: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("1.00 requests/second");
    }
  });

  it("should show token bucket information", async () => {
    const result = await executeTool(rateLimiterCalculator, {
      requests: 60,
      windowSeconds: 60,
      burstSize: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Token Bucket:");
      expect(output).toContain("Refill rate:");
    }
  });

  it("should show sliding window information", async () => {
    const result = await executeTool(rateLimiterCalculator, {
      requests: 100,
      windowSeconds: 60,
      burstSize: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Sliding Window:");
      expect(output).toContain("Max in window: 100");
    }
  });
});
