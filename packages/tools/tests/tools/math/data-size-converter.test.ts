import { describe, it, expect } from "vitest";
import { dataSizeConverter } from "../../../src/tools/math/data-size-converter";
import { executeTool } from "../../../src/core/executor";

describe("dataSizeConverter", () => {
  it("should have correct metadata", () => {
    expect(dataSizeConverter.meta.id).toBe("math/data-size-converter");
    expect(dataSizeConverter.meta.category).toBe("math");
  });

  it("should convert GB to MB", async () => {
    const result = await executeTool(
      dataSizeConverter,
      { input: "1" },
      { from: "GB", to: "MB" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });

  it("should convert KB to bytes", async () => {
    const result = await executeTool(
      dataSizeConverter,
      { input: "1" },
      { from: "KB", to: "B" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });

  it("should convert TB to GB", async () => {
    const result = await executeTool(
      dataSizeConverter,
      { input: "1" },
      { from: "TB", to: "GB" }
    );
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        parseFloat((result.data as Record<string, unknown>).output)
      ).toBeCloseTo(1000, 0);
  });
});
