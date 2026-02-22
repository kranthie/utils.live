import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexOptimizer } from "../../../src/tools/regex/regex-optimizer";

describe("Regex Optimizer", () => {
  it("should suggest \\d for [0-9]", async () => {
    const result = await executeTool(regexOptimizer, { input: "[0-9]+" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("\\d");
    }
  });

  it("should handle already optimal patterns", async () => {
    const result = await executeTool(regexOptimizer, { input: "\\d+" });
    expect(result.success).toBe(true);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(regexOptimizer, { input: "" });
    expect(result.success).toBe(false);
  });
});
