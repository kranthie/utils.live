import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateParser } from "../../../src/tools/datetime/date-parser";

describe("Date Parser", () => {
  it("should parse an ISO date string", async () => {
    const result = await executeTool(dateParser, {
      input: "2024-06-15T14:30:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("2024");
    }
  });

  it("should parse a date-only string", async () => {
    const result = await executeTool(dateParser, { input: "2024-03-01" });
    expect(result.success).toBe(true);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(dateParser, { input: "xyz" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).valid).toBe(false);
    }
  });
});
