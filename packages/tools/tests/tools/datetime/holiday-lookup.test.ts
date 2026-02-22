import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { holidayLookup } from "../../../src/tools/datetime/holiday-lookup";

describe("Holiday Lookup", () => {
  it("should have correct metadata", () => {
    expect(holidayLookup.meta.id).toBe("datetime/holiday-lookup");
    expect(holidayLookup.meta.category).toBe("datetime");
  });

  it("should return US holidays for 2024", async () => {
    const result = await executeTool(holidayLookup, {
      year: 2024,
      country: "us",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const holidays = data.holidays as Array<{ name: string; date: string }>;
      expect(holidays.length).toBe(11);
      expect(holidays.some((h) => h.name === "Christmas Day")).toBe(true);
      expect(holidays.some((h) => h.name === "Independence Day")).toBe(true);
    }
  });

  it("should return international holidays", async () => {
    const result = await executeTool(holidayLookup, {
      year: 2024,
      country: "international",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const holidays = data.holidays as Array<{ name: string; date: string }>;
      expect(holidays.length).toBe(10);
      expect(
        holidays.some((h) => h.name === "International Women's Day")
      ).toBe(true);
    }
  });

  it("should include MLK Day on correct date (3rd Monday of Jan)", async () => {
    const result = await executeTool(holidayLookup, {
      year: 2024,
      country: "us",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const holidays = data.holidays as Array<{ name: string; date: string }>;
      const mlk = holidays.find((h) =>
        h.name.includes("Martin Luther King")
      );
      expect(mlk).toBeDefined();
      expect(mlk!.date).toBe("2024-01-15");
    }
  });

  it("should have holidays sorted by date", async () => {
    const result = await executeTool(holidayLookup, {
      year: 2024,
      country: "us",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const holidays = data.holidays as Array<{ name: string; date: string }>;
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i]!.date >= holidays[i - 1]!.date).toBe(true);
      }
    }
  });
});
