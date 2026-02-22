import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { epochConverter } from "../../../src/tools/datetime/epoch-converter";

describe("Epoch Converter", () => {
  it("should convert a date to multiple epoch formats", async () => {
    const result = await executeTool(epochConverter, {
      input: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "1704067200"
      );
    }
  });

  it("should handle Unix timestamp input", async () => {
    const result = await executeTool(epochConverter, { input: "1704067200" });
    expect(result.success).toBe(true);
  });

  it("should fail on invalid date", async () => {
    const result = await executeTool(epochConverter, { input: "invalid" });
    expect(result.success).toBe(false);
  });
});
