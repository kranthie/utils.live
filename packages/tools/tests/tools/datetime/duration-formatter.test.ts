import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { durationFormatter } from "../../../src/tools/datetime/duration-formatter";

describe("Duration Formatter", () => {
  it("should have correct metadata", () => {
    expect(durationFormatter.meta.id).toBe("datetime/duration-formatter");
    expect(durationFormatter.meta.category).toBe("datetime");
  });

  it("should format milliseconds into days/hours/minutes/seconds", async () => {
    const result = await executeTool(durationFormatter, {
      input: "90061001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const components = data.components as Record<string, number>;
      expect(components.days).toBe(1);
      expect(components.hours).toBe(1);
      expect(components.minutes).toBe(1);
      expect(components.seconds).toBe(1);
      expect(components.milliseconds).toBe(1);
    }
  });

  it("should format zero milliseconds", async () => {
    const result = await executeTool(durationFormatter, { input: "0" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.formatted as string)).toContain("0 ms");
    }
  });

  it("should handle negative milliseconds", async () => {
    const result = await executeTool(durationFormatter, { input: "-3600000" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.formatted as string)).toContain("-");
      expect((data.formatted as string)).toContain("1 hour");
    }
  });

  it("should format large values", async () => {
    const result = await executeTool(durationFormatter, {
      input: "86400000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.formatted as string)).toContain("1 day");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(durationFormatter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-numeric input", async () => {
    const result = await executeTool(durationFormatter, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should pluralize correctly", async () => {
    const result = await executeTool(durationFormatter, {
      input: "172800000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.formatted as string)).toContain("2 days");
    }
  });
});
