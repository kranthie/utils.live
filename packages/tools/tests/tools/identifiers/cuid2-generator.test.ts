import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { cuid2Generator } from "../../../src/tools/identifiers/cuid2-generator";

describe("CUID2 Generator", () => {
  it("should generate a CUID2 of default length", async () => {
    const result = await executeTool(cuid2Generator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(24);
      // CUID2 starts with a lowercase letter
      expect((result.data as Record<string, unknown>).output).toMatch(/^[a-z]/);
    }
  });

  it("should generate custom length", async () => {
    const result = await executeTool(cuid2Generator, { length: 10 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(10);
    }
  });

  it("should generate multiple unique CUID2s", async () => {
    const result = await executeTool(cuid2Generator, { count: 5 });
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

  it("should only contain lowercase letters (a-z) with no digits", async () => {
    // CUID2 alphabet is purely lowercase letters; Math.random() output would also
    // produce lowercase letters, but crypto is more correct. This test enforces
    // the alphabet constraint regardless of the RNG used.
    const result = await executeTool(cuid2Generator, { length: 24, count: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      for (const id of ids) {
        expect(id).toMatch(/^[a-z]+$/);
        expect(id).toHaveLength(24);
      }
    }
  });

  it("should start with a lowercase letter (first char is not a digit)", async () => {
    const result = await executeTool(cuid2Generator, { length: 24, count: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      for (const id of ids) {
        expect(id[0]).toMatch(/[a-z]/);
      }
    }
  });
});
