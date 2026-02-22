import { describe, it, expect } from "vitest";
import { primeFactorization } from "../../../src/tools/math/prime-factorization";
import { executeTool } from "../../../src/core/executor";

describe("primeFactorization", () => {
  it("should have correct metadata", () => {
    expect(primeFactorization.meta.id).toBe("math/prime-factorization");
    expect(primeFactorization.meta.category).toBe("math");
  });

  it("should factorize 12", async () => {
    const result = await executeTool(primeFactorization, { input: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("2");
      expect((result.data as Record<string, unknown>).output).toContain("3");
    }
  });

  it("should handle prime number input", async () => {
    const result = await executeTool(primeFactorization, { input: "13" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("13");
  });

  it("should factorize powers of 2", async () => {
    const result = await executeTool(primeFactorization, { input: "64" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("2");
  });
});
