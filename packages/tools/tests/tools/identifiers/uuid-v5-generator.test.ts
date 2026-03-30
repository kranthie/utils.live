import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { uuidV5Generator } from "../../../src/tools/identifiers/uuid-v5-generator";

describe("UUID v5 Generator", () => {
  it("should generate a deterministic UUID v5 for same input", async () => {
    const r1 = await executeTool(uuidV5Generator, {
      name: "example.com",
      namespace: "dns",
    });
    const r2 = await executeTool(uuidV5Generator, {
      name: "example.com",
      namespace: "dns",
    });
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should have version 5 in UUID", async () => {
    const result = await executeTool(uuidV5Generator, {
      name: "test",
      namespace: "dns",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        String((result.data as Record<string, unknown>).output).charAt(14)
      ).toBe("5");
    }
  });

  it("should generate different UUIDs for different names", async () => {
    const r1 = await executeTool(uuidV5Generator, {
      name: "foo",
      namespace: "dns",
    });
    const r2 = await executeTool(uuidV5Generator, {
      name: "bar",
      namespace: "dns",
    });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });

  it("should fail for custom namespace without value", async () => {
    const result = await executeTool(uuidV5Generator, {
      name: "test",
      namespace: "custom",
      customNamespace: "",
    });
    expect(result.success).toBe(false);
  });

  it("should fail for malformed custom namespace UUID (not a valid UUID format)", async () => {
    const result = await executeTool(uuidV5Generator, {
      name: "test",
      namespace: "custom",
      customNamespace: "not-a-valid-uuid",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(
        /invalid.*namespace|namespace.*invalid/i
      );
    }
  });

  it("should succeed for a valid custom namespace UUID", async () => {
    const result = await executeTool(uuidV5Generator, {
      name: "test",
      namespace: "custom",
      customNamespace: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = String((result.data as Record<string, unknown>).output);
      expect(output).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    }
  });
});
