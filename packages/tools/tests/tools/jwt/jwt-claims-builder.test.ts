import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtClaimsBuilder } from "../../../src/tools/jwt/jwt-claims-builder";

describe("JWT Claims Builder", () => {
  it("should build claims with defaults", async () => {
    const result = await executeTool(jwtClaimsBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      const claims = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(claims.exp).toBeDefined();
      expect(claims.iat).toBeDefined();
    }
  });

  it("should include issuer and subject when provided", async () => {
    const result = await executeTool(jwtClaimsBuilder, {
      issuer: "myapp",
      subject: "user123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const claims = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(claims.iss).toBe("myapp");
      expect(claims.sub).toBe("user123");
    }
  });

  it("should include jti when requested", async () => {
    const result = await executeTool(jwtClaimsBuilder, { includeJti: true });
    expect(result.success).toBe(true);
    if (result.success) {
      const claims = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(claims.jti).toBeDefined();
      expect(typeof claims.jti).toBe("string");
    }
  });

  it("should merge custom claims", async () => {
    const result = await executeTool(jwtClaimsBuilder, {
      customClaims: '{"role":"admin","level":5}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const claims = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(claims.role).toBe("admin");
      expect(claims.level).toBe(5);
    }
  });
});
