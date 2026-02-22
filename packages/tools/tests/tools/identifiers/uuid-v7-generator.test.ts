import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { uuidV7Generator } from "../../../src/tools/identifiers/uuid-v7-generator";

describe("UUID v7 Generator", () => {
  it("should generate a valid UUID v7", async () => {
    const result = await executeTool(uuidV7Generator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    }
  });

  it("should generate time-ordered UUIDs", async () => {
    const result = await executeTool(uuidV7Generator, { count: 3 });
    expect(result.success).toBe(true);
    if (result.success) {
      const uuids = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(uuids).toHaveLength(3);
      // Timestamp prefixes (first 12 hex chars = 48-bit ms) should be non-decreasing
      const ts0 = parseInt(uuids[0]!.replace(/-/g, "").substring(0, 12), 16);
      const ts1 = parseInt(uuids[1]!.replace(/-/g, "").substring(0, 12), 16);
      const ts2 = parseInt(uuids[2]!.replace(/-/g, "").substring(0, 12), 16);
      expect(ts1).toBeGreaterThanOrEqual(ts0);
      expect(ts2).toBeGreaterThanOrEqual(ts1);
    }
  });

  it("should generate unique UUIDs", async () => {
    const result = await executeTool(uuidV7Generator, { count: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      const uuids = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      const unique = new Set(uuids);
      expect(unique.size).toBe(10);
    }
  });
});
