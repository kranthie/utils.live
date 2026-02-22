import { describe, it, expect } from "vitest";
import { cookiePolicyGenerator } from "../../../src/tools/legal/cookie-policy-generator";
import { executeTool } from "../../../src/core/executor";

describe("cookiePolicyGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(cookiePolicyGenerator.meta.id).toBe("legal/cookie-policy-generator");
      expect(cookiePolicyGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate default cookie policy", async () => {
      const result = await executeTool(cookiePolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Cookie Policy");
        expect(output).toContain("Company Name");
        expect(output).toContain("https://example.com");
        expect(output).toContain("Essential Cookies");
        expect(output).toContain("Analytics Cookies");
        expect(output).toContain("Preference Cookies");
      }
    });

    it("should include marketing cookies when enabled", async () => {
      const result = await executeTool(cookiePolicyGenerator, {
        usesMarketing: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Marketing Cookies");
      }
    });

    it("should not include marketing cookies by default", async () => {
      const result = await executeTool(cookiePolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("Marketing Cookies");
      }
    });

    it("should use custom company details", async () => {
      const result = await executeTool(cookiePolicyGenerator, {
        companyName: "Acme Corp",
        websiteUrl: "https://acme.com",
        email: "privacy@acme.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Acme Corp");
        expect(output).toContain("https://acme.com");
        expect(output).toContain("privacy@acme.com");
      }
    });

    it("should include browser settings section", async () => {
      const result = await executeTool(cookiePolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Chrome");
        expect(output).toContain("Firefox");
        expect(output).toContain("Safari");
        expect(output).toContain("Edge");
      }
    });

    it("should include legal disclaimer", async () => {
      const result = await executeTool(cookiePolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Consult a legal professional");
      }
    });
  });
});
