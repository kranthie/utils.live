import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { rfc2822Converter } from "../../../src/tools/datetime/rfc2822-converter";

describe("RFC 2822 Converter", () => {
  it("should convert a date to RFC 2822 format", async () => {
    const result = await executeTool(rfc2822Converter, {
      input: "2024-01-15T12:30:00Z",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("Mon");
      expect((result.data as Record<string, unknown>).output).toContain("Jan");
      expect((result.data as Record<string, unknown>).output).toContain("2024");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(rfc2822Converter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(rfc2822Converter, { input: "not-a-date" });
    expect(result.success).toBe(false);
  });
});
