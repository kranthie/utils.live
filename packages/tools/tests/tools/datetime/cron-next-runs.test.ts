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
});
