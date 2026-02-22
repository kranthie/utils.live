import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { nanoidGenerator } from "../../../src/tools/identifiers/nanoid-generator";

describe("NanoID Generator", () => {
  it("should generate a NanoID with default length", async () => {
    const result = await executeTool(nanoidGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(21);
    }
  });

  it("should generate custom length", async () => {
    const result = await executeTool(nanoidGenerator, { length: 10, count: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(10);
    }
  });

  it("should generate multiple IDs", async () => {
    const result = await executeTool(nanoidGenerator, { count: 5, length: 21 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(5);
    }
  });

  it("should reject alphabet with less than 2 chars", async () => {
    const result = await executeTool(nanoidGenerator, { alphabet: "a" });
    expect(result.success).toBe(false);
  });
});
