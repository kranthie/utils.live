import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { shortIdGenerator } from "../../../src/tools/identifiers/short-id-generator";

describe("Short ID Generator", () => {
  it("should generate an 8-char alphanumeric ID by default", async () => {
    const result = await executeTool(shortIdGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(8);
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9A-Za-z]+$/
      );
    }
  });

  it("should respect custom length", async () => {
    const result = await executeTool(shortIdGenerator, { length: 16 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(16);
    }
  });

  it("should use hex alphabet", async () => {
    const result = await executeTool(shortIdGenerator, {
      alphabet: "hex",
      length: 12,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9a-f]{12}$/
      );
    }
  });

  it("should generate multiple unique IDs", async () => {
    const result = await executeTool(shortIdGenerator, { count: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(10);
      const unique = new Set(ids);
      expect(unique.size).toBe(10);
    }
  });
});
