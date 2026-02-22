import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { dateRegex } from "../../../src/tools/regex/date-regex";

describe("Date Regex", () => {
  it("should return ISO date pattern", async () => {
    const result = await executeTool(dateRegex, { type: "iso" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return US date pattern", async () => {
    const result = await executeTool(dateRegex, { type: "us" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return EU date pattern", async () => {
    const result = await executeTool(dateRegex, { type: "eu" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });
});
