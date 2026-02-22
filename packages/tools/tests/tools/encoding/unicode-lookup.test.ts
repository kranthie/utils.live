import { describe, it, expect } from "vitest";
import { unicodeLookup } from "../../../src/tools/encoding/unicode-lookup";
import { executeTool } from "../../../src/core/executor";

describe("unicodeLookup", () => {
  it("should have correct metadata", () => {
    expect(unicodeLookup.meta.id).toBe("encoding/unicode-lookup");
  });

  it("should lookup by U+ notation", async () => {
    const result = await executeTool(unicodeLookup, { input: "U+0041" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("A");
      expect(output).toContain("U+0041");
    }
  });

  it("should lookup by 0x notation", async () => {
    const result = await executeTool(unicodeLookup, { input: "0x41" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("A");
    }
  });

  it("should lookup by character", async () => {
    const result = await executeTool(unicodeLookup, { input: "A" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("U+0041");
      expect(output).toContain("HTML Decimal");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(unicodeLookup, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should handle emoji lookup", async () => {
    const result = await executeTool(unicodeLookup, { input: "🌍" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("U+1F30D");
    }
  });
});
