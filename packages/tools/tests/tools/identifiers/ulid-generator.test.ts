import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { ulidGenerator } from "../../../src/tools/identifiers/ulid-generator";

describe("ULID Generator", () => {
  it("should generate a 26-character ULID", async () => {
    const result = await executeTool(ulidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(26);
      // ULID uses Crockford Base32
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9A-HJKMNP-TV-Z]{26}$/
      );
    }
  });

  it("should generate multiple unique ULIDs", async () => {
    const result = await executeTool(ulidGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ulids = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(ulids).toHaveLength(5);
      const unique = new Set(ulids);
      expect(unique.size).toBe(5);
    }
  });

  it("should be lexicographically sortable", async () => {
    const result = await executeTool(ulidGenerator, { count: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ulids = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      // Same millisecond - first 10 chars (timestamp) should be same or increasing
      expect(ulids[0]!.substring(0, 10) <= ulids[2]!.substring(0, 10)).toBe(
        true
      );
    }
  });
});
