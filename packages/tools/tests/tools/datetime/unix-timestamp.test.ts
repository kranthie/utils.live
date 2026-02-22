import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { unixTimestamp } from "../../../src/tools/datetime/unix-timestamp";

describe("Unix Timestamp", () => {
  it("should convert Unix timestamp in seconds", async () => {
    const result = await executeTool(unixTimestamp, { input: "1704067200" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).timestamp).toBe(
        1704067200
      );
      expect((result.data as Record<string, unknown>).iso).toBe(
        "2024-01-01T00:00:00.000Z"
      );
    }
  });

  it("should convert Unix timestamp in milliseconds", async () => {
    const result = await executeTool(unixTimestamp, { input: "1704067200000" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).timestamp).toBe(
        1704067200
      );
    }
  });

  it("should convert date string", async () => {
    const result = await executeTool(unixTimestamp, {
      input: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).timestamp).toBe(
        1704067200
      );
    }
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(unixTimestamp, { input: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(unixTimestamp, { input: "" });
    expect(result.success).toBe(false);
  });
});
