import { describe, it, expect } from "vitest";
import { currencyCodeReference } from "../../../src/tools/reference/currency-code-reference";
import { executeTool } from "../../../src/core/executor";

describe("currencyCodeReference", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(currencyCodeReference.meta.id).toBe("reference/currency-code-reference");
      expect(currencyCodeReference.meta.category).toBe("reference");
    });
  });

  describe("execute", () => {
    it("should return all currency codes without filter", async () => {
      const result = await executeTool(currencyCodeReference, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Code");
        expect(output).toContain("Symbol");
        expect(output).toContain("USD");
        expect(output).toContain("EUR");
        expect(output).toContain("US Dollar");
      }
    });

    it("should filter by currency code", async () => {
      const result = await executeTool(currencyCodeReference, {
        filter: "gbp",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("British Pound");
        expect(output).not.toContain("US Dollar");
      }
    });

    it("should filter by currency name", async () => {
      const result = await executeTool(currencyCodeReference, {
        filter: "euro",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("EUR");
      }
    });

    it("should filter by symbol", async () => {
      const result = await executeTool(currencyCodeReference, {
        filter: "$",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("USD");
      }
    });

    it("should include crypto currencies", async () => {
      const result = await executeTool(currencyCodeReference, {
        filter: "bitcoin",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("BTC");
      }
    });

    it("should return header only for no matches", async () => {
      const result = await executeTool(currencyCodeReference, {
        filter: "xyznonexistent",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const lines = output.split("\n");
        expect(lines.length).toBe(2);
      }
    });
  });
});
