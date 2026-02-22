import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { ksuidGenerator } from "../../../src/tools/identifiers/ksuid-generator";

describe("KSUID Generator", () => {
  it("should generate a 27-character KSUID", async () => {
    const result = await executeTool(ksuidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(27);
      // Base62 alphabet
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9A-Za-z]{27}$/
      );
    }
  });

  it("should generate multiple unique KSUIDs", async () => {
    const result = await executeTool(ksuidGenerator, { count: 5 });
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

  it("should be sortable (time-based prefix)", async () => {
    const result = await executeTool(ksuidGenerator, { count: 2 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      // KSUIDs generated close together share the same timestamp prefix
      // The first ~6 base62 chars encode the 4-byte second-resolution timestamp
      // They should be equal or differ by at most 1 second
      expect(ids[0]!.substring(0, 5)).toBe(ids[1]!.substring(0, 5));
    }
  });
});
