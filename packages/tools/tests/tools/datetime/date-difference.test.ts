import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateDifference } from "../../../src/tools/datetime/date-difference";

describe("Date Difference", () => {
  it("should have correct metadata", () => {
    expect(dateDifference.meta.id).toBe("datetime/date-difference");
    expect(dateDifference.meta.category).toBe("datetime");
  });

  it("should calculate difference between two dates", async () => {
    const result = await executeTool(dateDifference, {
      input1: "2024-01-01T00:00:00Z",
      input2: "2024-01-11T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(10);
      expect(data.hours).toBe(240);
    }
  });

  it("should handle same dates", async () => {
    const result = await executeTool(dateDifference, {
      input1: "2024-01-01T00:00:00Z",
      input2: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(0);
    }
  });

  it("should calculate absolute difference regardless of order", async () => {
    const result = await executeTool(dateDifference, {
      input1: "2024-12-31T00:00:00Z",
      input2: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(365);
    }
  });

  it("should fail on invalid start date", async () => {
    const result = await executeTool(dateDifference, {
      input1: "invalid",
      input2: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid end date", async () => {
    const result = await executeTool(dateDifference, {
      input1: "2024-01-01",
      input2: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should include weeks, months, and years", async () => {
    const result = await executeTool(dateDifference, {
      input1: "2020-01-01T00:00:00Z",
      input2: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(typeof data.weeks).toBe("number");
      expect(typeof data.months).toBe("number");
      expect(typeof data.years).toBe("number");
    }
  });

  it("should handle unix timestamps as input", async () => {
    const result = await executeTool(dateDifference, {
      input1: "1704067200",
      input2: "1704153600",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.days).toBe(1);
    }
  });
});
