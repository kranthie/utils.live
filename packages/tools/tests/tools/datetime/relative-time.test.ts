import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { relativeTime } from "../../../src/tools/datetime/relative-time";

describe("Relative Time", () => {
  it("should have correct metadata", () => {
    expect(relativeTime.meta.id).toBe("datetime/relative-time");
    expect(relativeTime.meta.category).toBe("datetime");
  });

  it("should show 'ago' for past dates", async () => {
    const pastDate = new Date(Date.now() - 86400000 * 10).toISOString();
    const result = await executeTool(relativeTime, { input: pastDate });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.direction).toBe("past");
      expect((data.relative as string)).toContain("ago");
    }
  });

  it("should show 'from now' for future dates", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    const result = await executeTool(relativeTime, { input: futureDate });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.direction).toBe("future");
      expect((data.relative as string)).toContain("from now");
    }
  });

  it("should show 'just now' for very recent dates", async () => {
    const now = new Date(Date.now() - 1000).toISOString();
    const result = await executeTool(relativeTime, { input: now });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.relative as string)).toMatch(/just now|seconds ago/);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(relativeTime, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(relativeTime, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should handle unix timestamp", async () => {
    const past = Math.floor(Date.now() / 1000) - 7200;
    const result = await executeTool(relativeTime, {
      input: String(past),
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.relative as string)).toContain("hours ago");
    }
  });

  it("should show years for very old dates", async () => {
    const result = await executeTool(relativeTime, { input: "2000-01-01" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.relative as string)).toContain("years ago");
    }
  });
});
