import { describe, it, expect } from "vitest";
import { expressionEvaluator } from "../../../src/tools/math/expression-evaluator";
import { executeTool } from "../../../src/core/executor";

describe("expressionEvaluator", () => {
  it("should have correct metadata", () => {
    expect(expressionEvaluator.meta.id).toBe("math/expression-evaluator");
    expect(expressionEvaluator.meta.category).toBe("math");
  });

  it("should evaluate simple addition", async () => {
    const result = await executeTool(expressionEvaluator, { input: "2 + 3" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("5");
  });

  it("should respect operator precedence", async () => {
    const result = await executeTool(expressionEvaluator, {
      input: "2 + 3 * 4",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("14");
  });

  it("should handle parentheses", async () => {
    const result = await executeTool(expressionEvaluator, {
      input: "(2 + 3) * 4",
    });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("20");
  });

  it("should handle negative numbers", async () => {
    const result = await executeTool(expressionEvaluator, { input: "-5 + 3" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("-2");
  });

  it("should handle exponents", async () => {
    const result = await executeTool(expressionEvaluator, { input: "2 ^ 10" });
    expect(result.success).toBe(true);
    if (result.success)
      expect((result.data as Record<string, unknown>).output).toContain("1024");
  });
});
