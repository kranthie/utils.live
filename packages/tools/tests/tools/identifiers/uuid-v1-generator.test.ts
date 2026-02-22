import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { uuidV1Generator } from "../../../src/tools/identifiers/uuid-v1-generator";

const UUID_V1_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("UUID v1 Generator", () => {
  it("should generate a valid UUID v1", async () => {
    const result = await executeTool(uuidV1Generator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        UUID_V1_REGEX
      );
    }
  });

  it("should generate multiple unique UUIDs", async () => {
    const result = await executeTool(uuidV1Generator, { count: 5 });
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

  it("should generate UUID with version 1 marker", async () => {
    const result = await executeTool(uuidV1Generator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      // 13th char should be 1 (version)
      expect(
        String((result.data as Record<string, unknown>).output).charAt(14)
      ).toBe("1");
    }
  });
});
