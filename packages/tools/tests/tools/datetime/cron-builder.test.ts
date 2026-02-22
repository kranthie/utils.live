import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cronBuilder } from "../../../src/tools/datetime/cron-builder";

describe("Cron Builder", () => {
  it("should have correct metadata", () => {
    expect(cronBuilder.meta.id).toBe("datetime/cron-builder");
    expect(cronBuilder.meta.category).toBe("datetime");
  });

  it("should return preset for every-minute", async () => {
    const result = await executeTool(cronBuilder, {
      preset: "every-minute",
      minute: "*",
      hour: "*",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("* * * * *");
    }
  });

  it("should return preset for every-hour", async () => {
    const result = await executeTool(cronBuilder, {
      preset: "every-hour",
      minute: "*",
      hour: "*",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("0 * * * *");
    }
  });

  it("should build custom cron expression", async () => {
    const result = await executeTool(cronBuilder, {
      preset: "custom",
      minute: "30",
      hour: "9",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "1-5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("30 9 * * 1-5");
    }
  });

  it("should display field breakdown", async () => {
    const result = await executeTool(cronBuilder, {
      preset: "every-day-midnight",
      minute: "*",
      hour: "*",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Minute:");
      expect((data.output as string)).toContain("Hour:");
      expect((data.output as string)).toContain("Day of Month:");
    }
  });

  it("should return preset for first-of-month", async () => {
    const result = await executeTool(cronBuilder, {
      preset: "first-of-month",
      minute: "*",
      hour: "*",
      dayOfMonth: "*",
      month: "*",
      dayOfWeek: "*",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("0 0 1 * *");
    }
  });
});
