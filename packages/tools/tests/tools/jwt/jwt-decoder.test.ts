import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtDecoder } from "../../../src/tools/jwt/jwt-decoder";

// A well-known test JWT: {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","name":"John Doe","iat":1516239022}
const TEST_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("JWT Decoder", () => {
  it("should decode a valid JWT", async () => {
    const result = await executeTool(jwtDecoder, { input: TEST_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      const header = JSON.parse(
        String((result.data as Record<string, unknown>).header)
      ) as Record<string, unknown>;
      expect(header.alg).toBe("HS256");
      expect(header.typ).toBe("JWT");
      const payload = JSON.parse(
        String((result.data as Record<string, unknown>).payload)
      ) as Record<string, unknown>;
      expect(payload.sub).toBe("1234567890");
      expect(payload.name).toBe("John Doe");
    }
  });

  it("should return signature", async () => {
    const result = await executeTool(jwtDecoder, { input: TEST_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).signature).toBe(
        "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      );
    }
  });

  it("should fail for invalid JWT format", async () => {
    const result = await executeTool(jwtDecoder, {
      input: "not.a.valid.jwt.token",
    });
    expect(result.success).toBe(false);
  });

  it("should fail for empty input", async () => {
    const result = await executeTool(jwtDecoder, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should handle JWT with extra whitespace", async () => {
    const result = await executeTool(jwtDecoder, { input: `  ${TEST_JWT}  ` });
    expect(result.success).toBe(true);
  });
});
