import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { intervalCalculator } from "../../../src/tools/datetime/interval-calculator";

describe("Interval Calculator", () => {
  it("should have correct metadata", () => {
    expect(intervalCalculator.meta.id).toBe("datetime/interval-calculator");
    expect(intervalCalculator.meta.category).toBe("datetime");
  });

  it("should calculate executions for 1s interval over 1 hour", async () => {
    const result = await executeTool(intervalCalculator, {
      intervalMs: 1000,
      duration: 3600,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Executions: 3600");
      expect(output).toContain("Hz");
    }
  });

  it("should calculate frequency for 500ms interval", async () => {
    const result = await executeTool(intervalCalculator, {
      intervalMs: 500,
      duration: 60,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Executions: 120");
    }
  });

  it("should show per-second/minute/hour/day rates", async () => {
    const result = await executeTool(intervalCalculator, {
      intervalMs: 1000,
      duration: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Per second:");
      expect(output).toContain("Per minute:");
      expect(output).toContain("Per hour:");
      expect(output).toContain("Per day:");
    }
  });

  it("should show interval in multiple units", async () => {
    const result = await executeTool(intervalCalculator, {
      intervalMs: 60000,
      duration: 3600,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Milliseconds: 60000");
      expect(output).toContain("Seconds: 60.000");
    }
  });
});
