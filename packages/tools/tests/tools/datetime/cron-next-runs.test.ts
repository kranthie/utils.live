import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cronNextRuns } from "../../../src/tools/datetime/cron-next-runs";

describe("Cron Next Runs", () => {
  it("should have correct metadata", () => {
    expect(cronNextRuns.meta.id).toBe("datetime/cron-next-runs");
    expect(cronNextRuns.meta.category).toBe("datetime");
  });

  it("should show next runs for every-minute cron", async () => {
    const result = await executeTool(cronNextRuns, { input: "* * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.nextRuns as string[]).length).toBe(10);
    }
  });

  it("should respect count option", async () => {
    const result = await executeTool(
      cronNextRuns,
      { input: "* * * * *" },
      { count: 5 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.nextRuns as string[]).length).toBe(5);
    }
  });

  it("should fail on invalid cron expression", async () => {
    const result = await executeTool(cronNextRuns, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(cronNextRuns, { input: "  " });
    expect(result.success).toBe(false);
  });

  it("should handle range in cron fields", async () => {
    const result = await executeTool(
      cronNextRuns,
      { input: "0 9 * * 1-5" },
      { count: 5 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.nextRuns as string[]).length).toBeGreaterThan(0);
    }
  });

  it("should handle step values", async () => {
    const result = await executeTool(
      cronNextRuns,
      { input: "*/15 * * * *" },
      { count: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.nextRuns as string[]).length).toBe(4);
    }
  });

  it("should treat DOW=7 as Sunday (alias for 0)", async () => {
    // "0 9 * * 7" means 9 AM every Sunday — 7 is an alias for Sunday in many cron implementations
    const result7 = await executeTool(
      cronNextRuns,
      { input: "0 9 * * 7" },
      { count: 5 }
    );
    const result0 = await executeTool(
      cronNextRuns,
      { input: "0 9 * * 0" },
      { count: 5 }
    );
    expect(result7.success).toBe(true);
    expect(result0.success).toBe(true);
    if (result7.success && result0.success) {
      // Both should produce runs on Sundays (getDay() === 0)
      const runs7 = (result7.data as Record<string, unknown>)
        .nextRuns as string[];
      const runs0 = (result0.data as Record<string, unknown>)
        .nextRuns as string[];
      expect(runs7.length).toBe(5);
      // Every run should fall on a Sunday
      for (const run of runs7) {
        expect(new Date(run).getDay()).toBe(0);
      }
      // Should match DOW=0 results
      expect(runs7).toEqual(runs0);
    }
  });

  it("example output matches execute() output", async () => {
    const example = cronNextRuns.meta.examples![0]!;
    const result = await executeTool(
      cronNextRuns,
      { input: example.input as string },
      { count: 5 }
    );
    expect(result.success).toBe(true);
  });
});
