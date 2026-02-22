import { describe, it, expect } from "vitest";
import { termsOfServiceGenerator } from "../../../src/tools/legal/terms-of-service-generator";
import { executeTool } from "../../../src/core/executor";

describe("termsOfServiceGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(termsOfServiceGenerator.meta.id).toBe(
        "legal/terms-of-service-generator"
      );
      expect(termsOfServiceGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate default terms of service", async () => {
      const result = await executeTool(termsOfServiceGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("# Terms of Service");
        expect(output).toContain("Company Name");
        expect(output).toContain("https://example.com");
        expect(output).toContain("2025-01-01");
      }
    });

    it("should include all standard sections", async () => {
      const result = await executeTool(termsOfServiceGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Acceptance of Terms");
        expect(output).toContain("Use of the Website");
        expect(output).toContain("Intellectual Property");
        expect(output).toContain("User Content");
        expect(output).toContain("Disclaimer of Warranties");
        expect(output).toContain("Limitation of Liability");
        expect(output).toContain("Indemnification");
        expect(output).toContain("Termination");
        expect(output).toContain("Changes to Terms");
        expect(output).toContain("Governing Law");
        expect(output).toContain("Contact");
      }
    });

    it("should use custom governing law", async () => {
      const result = await executeTool(termsOfServiceGenerator, {
        governingLaw: "Province of Ontario, Canada",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Province of Ontario, Canada");
      }
    });

    it("should use custom company details", async () => {
      const result = await executeTool(termsOfServiceGenerator, {
        companyName: "SaaS Corp",
        websiteUrl: "https://saas.io",
        email: "legal@saas.io",
        effectiveDate: "2025-06-01",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("SaaS Corp");
        expect(output).toContain("https://saas.io");
        expect(output).toContain("legal@saas.io");
        expect(output).toContain("2025-06-01");
      }
    });

    it("should include legal disclaimer", async () => {
      const result = await executeTool(termsOfServiceGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Consult a legal professional");
      }
    });
  });
});
