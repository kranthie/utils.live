import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { uuidV4Generator } from "../../../src/tools/identifiers/uuid-v4-generator";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("UUID v4 Generator", () => {
  it("should generate a valid UUID v4", async () => {
    const result = await executeTool(uuidV4Generator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        UUID_REGEX
      );
    }
  });

  it("should generate multiple unique UUIDs", async () => {
    const result = await executeTool(uuidV4Generator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const uuids = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(uuids).toHaveLength(5);
      const unique = new Set(uuids);
      expect(unique.size).toBe(5);
    }
  });

  it("should support uppercase", async () => {
    const result = await executeTool(uuidV4Generator, {
      count: 1,
      uppercase: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9A-F-]+$/
      );
    }
  });
});
