import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateRangeGenerator } from "../../../src/tools/datetime/date-range-generator";

describe("Date Range Generator", () => {
  it("should have correct metadata", () => {
    expect(dateRangeGenerator.meta.id).toBe("datetime/date-range-generator");
    expect(dateRangeGenerator.meta.category).toBe("datetime");
  });

  it("should generate daily dates in a range", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-01-01",
      endDate: "2024-01-05",
      step: "day",
      format: "iso",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBeGreaterThanOrEqual(4);
      expect((data.output as string)).toContain("2024-01-01");
    }
  });

  it("should generate weekly dates", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      step: "week",
      format: "iso",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBeGreaterThanOrEqual(4);
    }
  });

  it("should generate monthly dates", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-01-15",
      endDate: "2024-06-15",
      step: "month",
      format: "iso",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBeGreaterThanOrEqual(5);
    }
  });

  it("should format dates in short format", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-01-01",
      endDate: "2024-01-03",
      step: "day",
      format: "short",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Jan");
    }
  });

  it("should format dates in long format", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      step: "day",
      format: "long",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    }
  });

  it("should fail on invalid start date", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "invalid",
      endDate: "2024-01-31",
      step: "day",
      format: "iso",
    });
    expect(result.success).toBe(false);
  });

  it("should fail when start is after end", async () => {
    const result = await executeTool(dateRangeGenerator, {
      startDate: "2024-12-31",
      endDate: "2024-01-01",
      step: "day",
      format: "iso",
    });
    expect(result.success).toBe(false);
  });
});
