import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { creditCardRegex } from "../../../src/tools/regex/credit-card-regex";

describe("Credit Card Regex", () => {
  it("should return Visa pattern", async () => {
    const result = await executeTool(creditCardRegex, { type: "visa" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return all pattern", async () => {
    const result = await executeTool(creditCardRegex, { type: "any" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });

  it("should return Mastercard pattern", async () => {
    const result = await executeTool(creditCardRegex, { type: "mastercard" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).pattern).toBeDefined();
    }
  });
});
