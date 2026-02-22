import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { standardDeviation } from "../../../src/tools/math/standard-deviation";

describe("Standard Deviation", () => {
  it("should have correct metadata", () => {
    expect(standardDeviation.meta.id).toBe("math/standard-deviation");
    expect(standardDeviation.meta.category).toBe("math");
  });

  it("should calculate population standard deviation", async () => {
    const result = await executeTool(
      standardDeviation,
      { input: "2, 4, 4, 4, 5, 5, 7, 9" },
      { type: "population" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Type: population");
      expect(output).toContain("Mean: 5");
      expect(output).toContain("Standard Deviation: 2");
    }
  });

  it("should calculate sample standard deviation", async () => {
    const result = await executeTool(
      standardDeviation,
      { input: "2, 4, 4, 4, 5, 5, 7, 9" },
      { type: "sample" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("Type: sample");
      expect(output).toContain("Variance:");
    }
  });

  it("should calculate for identical values (zero deviation)", async () => {
    const result = await executeTool(
      standardDeviation,
      { input: "5, 5, 5, 5" },
      { type: "population" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Standard Deviation: 0");
    }
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(standardDeviation, { input: "abc" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(standardDeviation, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on single value with sample type", async () => {
    const result = await executeTool(
      standardDeviation,
      { input: "5" },
      { type: "sample" }
    );
    expect(result.success).toBe(false);
  });

  it("should handle single value with population type", async () => {
    const result = await executeTool(
      standardDeviation,
      { input: "5" },
      { type: "population" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("Standard Deviation: 0");
    }
  });
});
