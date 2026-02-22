import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { bulkIdGenerator } from "../../../src/tools/identifiers/bulk-id-generator";

describe("Bulk ID Generator", () => {
  it("should generate uuid-v4 IDs by default", async () => {
    const result = await executeTool(bulkIdGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(5);
      expect((result.data as Record<string, unknown>).count).toBe(5);
    }
  });

  it("should generate hex IDs with custom length", async () => {
    const result = await executeTool(bulkIdGenerator, {
      type: "hex",
      count: 3,
      length: 32,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(3);
      ids.forEach((id: string) => {
        expect(id).toMatch(/^[0-9a-f]{32}$/);
      });
    }
  });

  it("should use comma separator", async () => {
    const result = await executeTool(bulkIdGenerator, {
      type: "numeric",
      count: 3,
      separator: "comma",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(", ");
    }
  });

  it("should generate nanoid type", async () => {
    const result = await executeTool(bulkIdGenerator, {
      type: "nanoid",
      count: 2,
      length: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const ids = String((result.data as Record<string, unknown>).output).split(
        "\n"
      );
      expect(ids).toHaveLength(2);
      ids.forEach((id: string) => expect(id).toHaveLength(10));
    }
  });
});
