import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { objectidGenerator } from "../../../src/tools/identifiers/objectid-generator";

describe("ObjectID Generator", () => {
  it("should generate a 24-character hex ObjectID", async () => {
    const result = await executeTool(objectidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(24);
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9a-f]{24}$/
      );
    }
  });

  it("should generate multiple unique ObjectIDs", async () => {
    const result = await executeTool(objectidGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(5);
      const unique = new Set(ids);
      expect(unique.size).toBe(5);
    }
  });

  it("should embed timestamp in first 8 hex chars", async () => {
    const result = await executeTool(objectidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      const timestampHex = String(
        (result.data as Record<string, unknown>).output
      ).substring(0, 8);
      const timestamp = parseInt(timestampHex, 16);
      const now = Math.floor(Date.now() / 1000);
      expect(Math.abs(timestamp - now)).toBeLessThan(5);
    }
  });
});
