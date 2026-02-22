import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { worldClock } from "../../../src/tools/datetime/world-clock";

describe("World Clock", () => {
  it("should have correct metadata", () => {
    expect(worldClock.meta.id).toBe("datetime/world-clock");
    expect(worldClock.meta.category).toBe("datetime");
  });

  it("should show default cities when no input provided", async () => {
    const result = await executeTool(worldClock, { cities: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("World Clock");
      expect(output).toContain("New York");
      expect(output).toContain("London");
      expect(output).toContain("Tokyo");
    }
  });

  it("should show custom timezones", async () => {
    const result = await executeTool(worldClock, {
      cities: "America/New_York,Europe/London",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("New York");
      expect(output).toContain("London");
    }
  });

  it("should handle invalid timezone gracefully", async () => {
    const result = await executeTool(worldClock, {
      cities: "Invalid/Zone",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("invalid timezone");
    }
  });

  it("should include reference time", async () => {
    const result = await executeTool(worldClock, { cities: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Reference:");
    }
  });
});
