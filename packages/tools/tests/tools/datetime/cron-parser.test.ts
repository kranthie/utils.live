import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cronParser } from "../../../src/tools/datetime/cron-parser";

describe("Cron Parser", () => {
  it("should have correct metadata", () => {
    expect(cronParser.meta.id).toBe("datetime/cron-parser");
    expect(cronParser.meta.category).toBe("datetime");
  });

  it("should parse every-minute expression", async () => {
    const result = await executeTool(cronParser, { input: "* * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("every minute");
    }
  });

  it("should parse expression with step values", async () => {
    const result = await executeTool(cronParser, { input: "*/5 * * * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("5");
    }
  });

  it("should parse expression with specific values", async () => {
    const result = await executeTool(cronParser, { input: "0 9 * * 1" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Monday");
    }
  });

  it("should parse expression with range", async () => {
    const result = await executeTool(cronParser, { input: "0 9 * * 1-5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Monday");
      expect((data.output as string)).toContain("Friday");
    }
  });

  it("should parse expression with comma-separated values", async () => {
    const result = await executeTool(cronParser, { input: "0 9 * * 1,3,5" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Monday");
    }
  });

  it("should handle 6-field cron (with year)", async () => {
    const result = await executeTool(cronParser, {
      input: "0 0 1 1 * 2024",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Year:");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(cronParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on too few fields", async () => {
    const result = await executeTool(cronParser, { input: "* * *" });
    expect(result.success).toBe(false);
  });

  it("should handle question mark in fields", async () => {
    const result = await executeTool(cronParser, { input: "0 9 ? * 1" });
    expect(result.success).toBe(true);
  });
});
