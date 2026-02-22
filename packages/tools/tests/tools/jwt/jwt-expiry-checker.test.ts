import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtExpiryChecker } from "../../../src/tools/jwt/jwt-expiry-checker";

// JWT with iat but no exp: {"sub":"1234567890","name":"John Doe","iat":1516239022}
const NO_EXP_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("JWT Expiry Checker", () => {
  it("should detect token without exp as not expired but warn", async () => {
    const result = await executeTool(jwtExpiryChecker, { input: NO_EXP_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).expired).toBe(false);
      expect((result.data as Record<string, unknown>).output).toContain(
        "No expiration claim"
      );
    }
  });

  it("should extract issuedAt when present", async () => {
    const result = await executeTool(jwtExpiryChecker, { input: NO_EXP_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).issuedAt).toBeDefined();
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(jwtExpiryChecker, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JWT", async () => {
    const result = await executeTool(jwtExpiryChecker, { input: "invalid" });
    expect(result.success).toBe(false);
  });
});
