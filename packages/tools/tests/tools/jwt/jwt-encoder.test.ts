import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtEncoder } from "../../../src/tools/jwt/jwt-encoder";

describe("JWT Encoder", () => {
  it("should create a valid JWT with HS256", async () => {
    const result = await executeTool(
      jwtEncoder,
      { input: '{"sub":"123","name":"Test"}' },
      { secret: "mysecretkey123", algorithm: "HS256" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const parts = String(
        (result.data as Record<string, unknown>).output
      ).split(".");
      expect(parts).toHaveLength(3);
    }
  });

  it("should include correct header", async () => {
    const result = await executeTool(
      jwtEncoder,
      { input: '{"sub":"123"}' },
      { secret: "my-strong-key", algorithm: "HS256" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const headerPart = String(
        (result.data as Record<string, unknown>).output
      ).split(".")[0];
      let base64 = headerPart.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) base64 += "=";
      const header = JSON.parse(atob(base64)) as Record<string, unknown>;
      expect(header.alg).toBe("HS256");
      expect(header.typ).toBe("JWT");
    }
  });

  it("should fail for invalid JSON payload", async () => {
    const result = await executeTool(
      jwtEncoder,
      { input: "not json" },
      { secret: "my-strong-key" }
    );
    expect(result.success).toBe(false);
  });

  it("should fail for array payload", async () => {
    const result = await executeTool(
      jwtEncoder,
      { input: "[1,2,3]" },
      { secret: "my-strong-key" }
    );
    expect(result.success).toBe(false);
  });

  it("should reject short secret keys (under 8 characters)", async () => {
    const result = await executeTool(
      jwtEncoder,
      { input: '{"sub":"123"}' },
      { secret: "short" }
    );
    expect(result.success).toBe(false);
  });

  it("should use default options when none provided", async () => {
    const result = await executeTool(jwtEncoder, {
      input: '{"sub":"123"}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const parts = String(
        (result.data as Record<string, unknown>).output
      ).split(".");
      expect(parts).toHaveLength(3);
    }
  });

  it("should produce deterministic output for same inputs", async () => {
    const opts = { secret: "test-secret-key", algorithm: "HS256" as const };
    const r1 = await executeTool(jwtEncoder, { input: '{"sub":"123"}' }, opts);
    const r2 = await executeTool(jwtEncoder, { input: '{"sub":"123"}' }, opts);
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});
