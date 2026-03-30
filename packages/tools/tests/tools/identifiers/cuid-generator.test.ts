import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cuidGenerator } from "../../../src/tools/identifiers/cuid-generator";

describe("CUID Generator", () => {
  it("should generate a CUID starting with 'c'", async () => {
    const result = await executeTool(cuidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).startsWith("c")
      ).toBe(true);
    }
  });

  it("should generate multiple unique CUIDs", async () => {
    const result = await executeTool(cuidGenerator, { count: 5 });
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

  it("should generate CUIDs with exact length of 25", async () => {
    const result = await executeTool(cuidGenerator, { count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      // CUIDs are exactly 25 characters: c + 8 timestamp + 4 counter + 4 fingerprint + 4 rand + 4 rand
      expect(
        String((result.data as Record<string, unknown>).output).length
      ).toBe(25);
    }
  });

  it("should generate CUIDs containing only lowercase base36 chars after the prefix", async () => {
    const result = await executeTool(cuidGenerator, { count: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      for (const id of ids) {
        expect(id).toMatch(/^c[0-9a-z]{24}$/);
      }
    }
  });
});
