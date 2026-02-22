import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { permutationCombination } from "../../../src/tools/math/permutation-combination";

describe("Permutation & Combination", () => {
  it("should have correct metadata", () => {
    expect(permutationCombination.meta.id).toBe(
      "math/permutation-combination"
    );
    expect(permutationCombination.meta.category).toBe("math");
  });

  it("should calculate P(5,2) and C(5,2)", async () => {
    const result = await executeTool(permutationCombination, {
      input: "5, 2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("P(5, 2) = 20");
      expect((data.output as string)).toContain("C(5, 2) = 10");
    }
  });

  it("should calculate P(10,3) and C(10,3)", async () => {
    const result = await executeTool(permutationCombination, {
      input: "10, 3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("P(10, 3) = 720");
      expect((data.output as string)).toContain("C(10, 3) = 120");
    }
  });

  it("should handle n=r (all selected)", async () => {
    const result = await executeTool(permutationCombination, {
      input: "5, 5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("P(5, 5) = 120");
      expect((data.output as string)).toContain("C(5, 5) = 1");
    }
  });

  it("should handle r=0", async () => {
    const result = await executeTool(permutationCombination, {
      input: "5, 0",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("P(5, 0) = 1");
      expect((data.output as string)).toContain("C(5, 0) = 1");
    }
  });

  it("should fail when r > n", async () => {
    const result = await executeTool(permutationCombination, {
      input: "3, 5",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on negative numbers", async () => {
    const result = await executeTool(permutationCombination, {
      input: "-1, 2",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(permutationCombination, {
      input: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on n > 170", async () => {
    const result = await executeTool(permutationCombination, {
      input: "171, 2",
    });
    expect(result.success).toBe(false);
  });
});
