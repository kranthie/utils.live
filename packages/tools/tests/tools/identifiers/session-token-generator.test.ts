import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { sessionTokenGenerator } from "../../../src/tools/identifiers/session-token-generator";

describe("Session Token Generator", () => {
  it("should generate hex token by default", async () => {
    const result = await executeTool(sessionTokenGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[0-9a-f]+$/
      );
      expect((result.data as Record<string, unknown>).output).toHaveLength(64);
      expect((result.data as Record<string, unknown>).entropy).toBeGreaterThan(
        0
      );
    }
  });

  it("should generate base64 format", async () => {
    const result = await executeTool(sessionTokenGenerator, {
      format: "base64",
      length: 32,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toHaveLength(32);
    }
  });

  it("should generate alphanumeric format", async () => {
    const result = await executeTool(sessionTokenGenerator, {
      format: "alphanumeric",
      length: 48,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toMatch(
        /^[A-Za-z0-9]+$/
      );
    }
  });

  it("should generate multiple unique tokens", async () => {
    const result = await executeTool(sessionTokenGenerator, { count: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      const tokens = String(
        (result.data as Record<string, unknown>).output
      ).split("\n");
      expect(tokens).toHaveLength(5);
      const unique = new Set(tokens);
      expect(unique.size).toBe(5);
    }
  });
});
