import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { ageCalculator } from "../../../src/tools/datetime/age-calculator";

describe("Age Calculator", () => {
  it("should have correct metadata", () => {
    expect(ageCalculator.meta.id).toBe("datetime/age-calculator");
    expect(ageCalculator.meta.category).toBe("datetime");
  });

  it("should calculate age correctly with reference date", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "1990-01-01",
      referenceDate: "2024-06-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.years).toBe(34);
      expect(data.months).toBe(5);
      expect(data.days).toBe(14);
      expect(typeof data.totalDays).toBe("number");
      expect((data.output as string)).toContain("34 years");
    }
  });

  it("should calculate age for same day", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "2000-03-15",
      referenceDate: "2000-03-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.years).toBe(0);
      expect(data.months).toBe(0);
      expect(data.days).toBe(0);
      expect(data.totalDays).toBe(0);
    }
  });

  it("should throw on invalid birthdate", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "invalid",
      referenceDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("should throw on invalid reference date", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "1990-01-01",
      referenceDate: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should throw when birthdate is after reference date", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "2025-01-01",
      referenceDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("should handle day adjustment when days < 0", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "1990-01-31",
      referenceDate: "2024-02-15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.years).toBe(34);
    }
  });

  it("should include next birthday info", async () => {
    const result = await executeTool(ageCalculator, {
      birthdate: "1990-06-15",
      referenceDate: "2024-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Next birthday");
    }
  });
});
