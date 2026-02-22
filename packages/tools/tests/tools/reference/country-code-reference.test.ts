import { describe, it, expect } from "vitest";
import { countryCodeReference } from "../../../src/tools/reference/country-code-reference";
import { executeTool } from "../../../src/core/executor";

describe("countryCodeReference", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(countryCodeReference.meta.id).toBe("reference/country-code-reference");
      expect(countryCodeReference.meta.category).toBe("reference");
    });
  });

  describe("execute", () => {
    it("should return all country codes without filter", async () => {
      const result = await executeTool(countryCodeReference, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("ISO2");
        expect(output).toContain("ISO3");
        expect(output).toContain("Phone");
        expect(output).toContain("United States");
        expect(output).toContain("United Kingdom");
      }
    });

    it("should filter by country name", async () => {
      const result = await executeTool(countryCodeReference, {
        filter: "japan",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Japan");
        expect(output).toContain("JP");
        expect(output).toContain("JPN");
        expect(output).not.toContain("United States");
      }
    });

    it("should filter by ISO2 code", async () => {
      const result = await executeTool(countryCodeReference, { filter: "DE" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Germany");
      }
    });

    it("should filter by ISO3 code", async () => {
      const result = await executeTool(countryCodeReference, { filter: "fra" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("France");
      }
    });

    it("should filter by phone code", async () => {
      const result = await executeTool(countryCodeReference, {
        filter: "+81",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Japan");
      }
    });

    it("should return empty result for no matches", async () => {
      const result = await executeTool(countryCodeReference, {
        filter: "zzzzzzz",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("ISO2");
        // Only header and separator, no country rows
        const lines = output.split("\n");
        expect(lines.length).toBe(2);
      }
    });
  });
});
