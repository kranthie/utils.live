import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { countdownCalculator } from "../../../src/tools/datetime/countdown-calculator";

describe("Countdown Calculator", () => {
  it("should have correct metadata", () => {
    expect(countdownCalculator.meta.id).toBe("datetime/countdown-calculator");
    expect(countdownCalculator.meta.category).toBe("datetime");
  });

  it("should calculate countdown for future date", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    const result = await executeTool(countdownCalculator, {
      input: futureDate,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isPast).toBe(false);
      expect((data.output as string)).toContain("remaining");
    }
  });

  it("should calculate countdown for past date", async () => {
    const result = await executeTool(countdownCalculator, {
      input: "2020-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.isPast).toBe(true);
      expect((data.output as string)).toContain("ago");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(countdownCalculator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(countdownCalculator, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should return numeric components", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    const result = await executeTool(countdownCalculator, {
      input: futureDate,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.days).toBe("number");
      expect(typeof data.hours).toBe("number");
      expect(typeof data.minutes).toBe("number");
      expect(typeof data.seconds).toBe("number");
      expect(typeof data.totalMs).toBe("number");
    }
  });
});
