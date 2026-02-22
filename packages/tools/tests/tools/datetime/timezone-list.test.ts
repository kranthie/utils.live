import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { timezoneList } from "../../../src/tools/datetime/timezone-list";

describe("Timezone List", () => {
  it("should have correct metadata", () => {
    expect(timezoneList.meta.id).toBe("datetime/timezone-list");
    expect(timezoneList.meta.category).toBe("datetime");
  });

  it("should list all timezones without filter", async () => {
    const result = await executeTool(timezoneList, { filter: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.timezones as string[]).length).toBeGreaterThan(50);
      expect(data.count).toBeGreaterThan(50);
      expect((data.timezones as string[])).toContain("UTC");
    }
  });

  it("should filter timezones by region", async () => {
    const result = await executeTool(timezoneList, { filter: "Europe" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const timezones = data.timezones as string[];
      expect(timezones.length).toBeGreaterThan(0);
      timezones.forEach((tz) => {
        expect(tz.toLowerCase()).toContain("europe");
      });
    }
  });

  it("should filter timezones by city name", async () => {
    const result = await executeTool(timezoneList, { filter: "Tokyo" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const timezones = data.timezones as string[];
      expect(timezones).toContain("Asia/Tokyo");
    }
  });

  it("should return empty list for non-matching filter", async () => {
    const result = await executeTool(timezoneList, {
      filter: "nonexistent_tz_xyz",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect(data.count).toBe(0);
    }
  });

  it("should be case-insensitive in filter", async () => {
    const result = await executeTool(timezoneList, { filter: "asia" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.timezones as string[]).length).toBeGreaterThan(0);
    }
  });
});
