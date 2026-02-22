import { describe, it, expect } from "vitest";
import { primeChecker } from "../../../src/tools/math/prime-checker";
import { executeTool } from "../../../src/core/executor";

describe("primeChecker", () => {
  it("should have correct metadata", () => {
    expect(primeChecker.meta.id).toBe("math/prime-checker");
    expect(primeChecker.meta.category).toBe("math");
  });

  it("should identify prime numbers", async () => {
    const result = await executeTool(primeChecker, { input: "17" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toMatch(/prime/i);
  });

  it("should identify non-prime numbers", async () => {
    const result = await executeTool(primeChecker, { input: "15" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toMatch(
        /not.*prime/i
      );
  });

  it("should handle 1 as not prime", async () => {
    const result = await executeTool(primeChecker, { input: "1" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toMatch(
        /not.*prime/i
      );
  });

  it("should handle 2 as prime", async () => {
    const result = await executeTool(primeChecker, { input: "2" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toMatch(/prime/i);
  });
});
