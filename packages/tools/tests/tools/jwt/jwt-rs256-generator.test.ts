import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtRs256Generator } from "../../../src/tools/jwt/jwt-rs256-generator";

describe("JWT RS256 Generator", () => {
  it("should generate a valid RS256 JWT with keys", async () => {
    const result = await executeTool(jwtRs256Generator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const parts = String(
        (result.data as Record<string, unknown>).token
      ).split(".");
      expect(parts).toHaveLength(3);
      expect((result.data as Record<string, unknown>).publicKeyPem).toContain(
        "BEGIN PUBLIC KEY"
      );
      expect((result.data as Record<string, unknown>).privateKeyPem).toContain(
        "BEGIN PRIVATE KEY"
      );
    }
  });

  it("should include exp and iat in payload", async () => {
    const result = await executeTool(jwtRs256Generator, {
      payload: '{"sub":"test"}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const payloadPart = String(
        (result.data as Record<string, unknown>).token
      ).split(".")[1]!;
      let base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) base64 += "=";
      const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
      expect(payload.exp).toBeDefined();
      expect(payload.iat).toBeDefined();
    }
  });

  it("should reject invalid JSON payload", async () => {
    const result = await executeTool(jwtRs256Generator, {
      payload: "not-json",
    });
    expect(result.success).toBe(false);
  });
});
