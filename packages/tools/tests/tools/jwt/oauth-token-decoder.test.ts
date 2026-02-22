import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { oauthTokenDecoder } from "../../../src/tools/jwt/oauth-token-decoder";

const JWT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("OAuth Token Decoder", () => {
  it("should detect and decode JWT tokens", async () => {
    const result = await executeTool(oauthTokenDecoder, { input: JWT_TOKEN });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).type).toBe("JWT");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Header"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Payload"
      );
    }
  });

  it("should detect opaque tokens", async () => {
    const result = await executeTool(oauthTokenDecoder, {
      input: "abc123def456xyz789",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).type).toBe("Opaque");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(oauthTokenDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});
