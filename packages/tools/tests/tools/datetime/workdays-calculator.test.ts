import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { workdaysCalculator } from "../../../src/tools/datetime/workdays-calculator";

describe("Workdays Calculator", () => {
  it("should have correct metadata", () => {
    expect(workdaysCalculator.meta.id).toBe("datetime/workdays-calculator");
    expect(workdaysCalculator.meta.category).toBe("datetime");
  });

  it("should calculate business days between two dates", async () => {
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-01", input2: "2024-01-31" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.businessDays).toBe("number");
      expect(typeof data.weekends).toBe("number");
      expect(typeof data.totalDays).toBe("number");
      expect(
        (data.businessDays as number) + (data.weekends as number)
      ).toBeGreaterThan(0);
    }
  });

  it("should include weekends when excludeWeekends is false", async () => {
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-01", input2: "2024-01-07" },
      { excludeWeekends: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      // Jan 1–7 = 7 calendar days inclusive
      expect(data.totalDays).toBe(7);
      // Result for calendar-day mode must equal totalDays, not totalDays+1
      expect(data.output as string).toContain("Result:        7 calendar days");
    }
  });

  it("should handle reversed dates (auto-sorts)", async () => {
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-31", input2: "2024-01-01" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.businessDays).toBe("number");
    }
  });

  it("should fail on invalid start date", async () => {
    const result = await executeTool(workdaysCalculator, {
      input1: "invalid",
      input2: "2024-01-07",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid end date", async () => {
    const result = await executeTool(workdaysCalculator, {
      input1: "2024-01-01",
      input2: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should return zero weekends for all-weekday span", async () => {
    // Mon Jan 8 to Fri Jan 12, 2024 — use midday UTC to avoid timezone boundary shifts
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-08T12:00:00Z", input2: "2024-01-12T12:00:00Z" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.weekends).toBe(0);
      expect(data.businessDays).toBe(5);
    }
  });

  it("should output formatted result", async () => {
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-01", input2: "2024-01-31" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output as string).toContain("Business days:");
      expect(data.output as string).toContain("Weekend days:");
      expect(data.output as string).toContain("Total days:");
    }
  });

  it("totalDays equals businessDays + weekends (inclusive count)", async () => {
    // Jan 8 Mon to Jan 12 Fri = 5 days inclusive: 5 business, 0 weekend
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-08T12:00:00Z", input2: "2024-01-12T12:00:00Z" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const total = data.totalDays as number;
      const biz = data.businessDays as number;
      const wknd = data.weekends as number;
      expect(total).toBe(biz + wknd);
    }
  });

  it("should be timezone-invariant: Mon-Fri week with UTC midnight inputs has 5 business days", async () => {
    // Regression: getDay() used local time. For UTC midnight inputs in PST (UTC-8),
    // the local day is the previous day, misclassifying weekday/weekend.
    // 2024-01-08 (Mon) to 2024-01-12 (Fri) = 5 business days, 0 weekends.
    const result = await executeTool(
      workdaysCalculator,
      { input1: "2024-01-08", input2: "2024-01-12" },
      { excludeWeekends: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.weekends).toBe(0);
      expect(data.businessDays).toBe(5);
    }
  });

  it("example output matches execute()", async () => {
    const example = workdaysCalculator.meta.examples![0]!;
    const input = example.input as { input1: string; input2: string };
    const result = await executeTool(workdaysCalculator, {
      input1: input.input1,
      input2: input.input2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe(example.output);
    }
  });
});
