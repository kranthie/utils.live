import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { meetingPlanner } from "../../../src/tools/datetime/meeting-planner";

describe("Meeting Planner", () => {
  it("should have correct metadata", () => {
    expect(meetingPlanner.meta.id).toBe("datetime/meeting-planner");
    expect(meetingPlanner.meta.category).toBe("datetime");
  });

  it("should find overlapping hours between two timezones", async () => {
    const result = await executeTool(meetingPlanner, {
      timezones: "America/New_York,Europe/London",
      businessStart: 9,
      businessEnd: 17,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.overlappingHours as string[]).length).toBeGreaterThan(0);
      expect((data.output as string)).toContain("Meeting Planner");
    }
  });

  it("should fail with less than 2 timezones", async () => {
    const result = await executeTool(meetingPlanner, {
      timezones: "America/New_York",
      businessStart: 9,
      businessEnd: 17,
    });
    expect(result.success).toBe(false);
  });

  it("should fail with invalid timezone", async () => {
    const result = await executeTool(meetingPlanner, {
      timezones: "America/New_York,Invalid/Timezone",
      businessStart: 9,
      businessEnd: 17,
    });
    expect(result.success).toBe(false);
  });

  it("should handle three timezones", async () => {
    const result = await executeTool(meetingPlanner, {
      timezones: "America/New_York,Europe/London,Asia/Tokyo",
      businessStart: 9,
      businessEnd: 17,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("America/New_York");
      expect((data.output as string)).toContain("Europe/London");
      expect((data.output as string)).toContain("Asia/Tokyo");
    }
  });

  it("should show business hours range", async () => {
    const result = await executeTool(meetingPlanner, {
      timezones: "America/New_York,Europe/London",
      businessStart: 8,
      businessEnd: 18,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("8:00 - 18:00");
    }
  });
});
