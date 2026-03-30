import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { quarterCalculator } from "../../../src/tools/datetime/quarter-calculator";

describe("Quarter Calculator", () => {
  it("should have correct metadata", () => {
    expect(quarterCalculator.meta.id).toBe("datetime/quarter-calculator");
    expect(quarterCalculator.meta.category).toBe("datetime");
  });

  it("should return Q1 for January", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-01-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(1);
      expect(data.year).toBe(2024);
    }
  });

  it("should return Q2 for May", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-05-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(2);
    }
  });

  it("should return Q3 for August", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-08-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(3);
    }
  });

  it("should return Q4 for November", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-11-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(4);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(quarterCalculator, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(quarterCalculator, { input: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should include quarter start and end dates", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-05-15T12:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.quarterStart).toBe("string");
      expect(typeof data.quarterEnd).toBe("string");
    }
  });

  it("should handle string dates", async () => {
    const result = await executeTool(quarterCalculator, {
      input: "2024-03-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(1);
    }
  });

  it("quarter should be timezone-invariant: 2025-01-01 must be Q1 2025", async () => {
    // Regression: getMonth()/getFullYear() used local time. In PDT (UTC-7),
    // "2025-01-01" (UTC midnight) is Dec 31, 2024 locally → returns Q4 2024.
    const result = await executeTool(quarterCalculator, {
      input: "2025-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.quarter).toBe(1);
      expect(data.year).toBe(2025);
      expect(data.quarterStart).toBe("2025-01-01");
      expect(data.quarterEnd).toBe("2025-03-31");
    }
  });
});
