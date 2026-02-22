import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { englishToCron } from "../../../src/tools/datetime/english-to-cron";

describe("English to Cron", () => {
  it("should have correct metadata", () => {
    expect(englishToCron.meta.id).toBe("datetime/english-to-cron");
    expect(englishToCron.meta.category).toBe("datetime");
  });

  it("should convert 'every minute'", async () => {
    const result = await executeTool(englishToCron, { input: "every minute" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("* * * * *");
      expect(data.confidence).toBe("high");
    }
  });

  it("should convert 'every 5 minutes'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every 5 minutes",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("*/5 * * * *");
    }
  });

  it("should convert 'every hour'", async () => {
    const result = await executeTool(englishToCron, { input: "every hour" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 * * * *");
    }
  });

  it("should convert 'every day at midnight'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every day at midnight",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 0 * * *");
    }
  });

  it("should convert 'every day at noon'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every day at noon",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 12 * * *");
    }
  });

  it("should convert 'every day at 9:30'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every day at 9:30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("30 9 * * *");
    }
  });

  it("should convert 'every day at 3pm'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every day at 3 pm",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 15 * * *");
    }
  });

  it("should convert 'every monday'", async () => {
    const result = await executeTool(englishToCron, { input: "every monday" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 9 * * 1");
    }
  });

  it("should convert 'every weekday'", async () => {
    const result = await executeTool(englishToCron, { input: "every weekday" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 9 * * 1-5");
    }
  });

  it("should return no confidence for unrecognized input", async () => {
    const result = await executeTool(englishToCron, {
      input: "something random",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.confidence).toBe("none");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(englishToCron, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should convert 'every weekend'", async () => {
    const result = await executeTool(englishToCron, { input: "every weekend" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 9 * * 0,6");
    }
  });

  it("should convert 'twice a day'", async () => {
    const result = await executeTool(englishToCron, { input: "twice a day" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 0,12 * * *");
    }
  });

  it("should convert 'every year'", async () => {
    const result = await executeTool(englishToCron, { input: "every year" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 0 1 1 *");
    }
  });

  it("should convert 'every day at 12am'", async () => {
    const result = await executeTool(englishToCron, {
      input: "every day at 12 am",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 0 * * *");
    }
  });

  it("should convert 'every 3 hours'", async () => {
    const result = await executeTool(englishToCron, { input: "every 3 hours" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.output).toBe("0 */3 * * *");
    }
  });
});
