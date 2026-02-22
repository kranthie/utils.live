import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { jwtDebugger } from "../../../src/tools/jwt/jwt-debugger";

const VALID_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("JWT Debugger", () => {
  it("should debug a valid JWT", async () => {
    const result = await executeTool(jwtDebugger, { input: VALID_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "JWT Debug Report"
      );
      expect((result.data as Record<string, unknown>).issues).toBeInstanceOf(
        Array
      );
      expect(
        (result.data as Record<string, unknown>).suggestions
      ).toBeInstanceOf(Array);
    }
  });

  it("should detect empty token", async () => {
    const result = await executeTool(jwtDebugger, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).issues).toContain(
        "Token is empty"
      );
    }
  });

  it("should detect invalid structure", async () => {
    const result = await executeTool(jwtDebugger, { input: "only.two" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        ((result.data as Record<string, unknown>).issues as string[]).some(
          (i: string) => i.includes("Invalid structure")
        )
      ).toBe(true);
    }
  });

  it("should report no exp claim issue", async () => {
    const result = await executeTool(jwtDebugger, { input: VALID_JWT });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(
        ((result.data as Record<string, unknown>).issues as string[]).some(
          (i: string) => i.includes("exp")
        )
      ).toBe(true);
    }
  });
});
