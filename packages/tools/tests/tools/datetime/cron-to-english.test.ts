import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cronToEnglish } from "../../../src/tools/datetime/cron-to-english";

describe("Cron to English", () => {
  it("should have correct metadata", () => {
    expect(cronToEnglish.meta.id).toBe("datetime/cron-to-english");
    expect(cronToEnglish.meta.category).toBe("datetime");
  });

  it("should convert every minute", async () => {
    const result = await executeTool(cronToEnglish, { input: "* * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toBe("Every minute");
    }
  });

  it("should convert every hour", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("hour");
    }
  });

  it("should convert every day at midnight", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 0 * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("midnight");
    }
  });

  it("should convert every day at noon", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 12 * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("noon");
    }
  });

  it("should convert every N minutes", async () => {
    const result = await executeTool(cronToEnglish, { input: "*/5 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("5 minutes");
    }
  });

  it("should convert every N hours", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 */3 * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("3 hours");
    }
  });

  it("should handle specific time with day", async () => {
    const result = await executeTool(cronToEnglish, { input: "30 9 * * 1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("09:30");
    }
  });

  it("should fail on fewer than 5 fields", async () => {
    const result = await executeTool(cronToEnglish, { input: "* *" });
    expect(result.success).toBe(false);
  });

  it("should handle comma-separated day values", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 9 * * 0,6" });
    expect(result.success).toBe(true);
  });

  it("should handle range with names", async () => {
    const result = await executeTool(cronToEnglish, { input: "0 9 * * 1-5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Monday");
      expect((data.output as string)).toContain("Friday");
    }
  });
});
