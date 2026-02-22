import { describe, it, expect } from "vitest";
import { privacyPolicyGenerator } from "../../../src/tools/legal/privacy-policy-generator";
import { executeTool } from "../../../src/core/executor";

describe("privacyPolicyGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(privacyPolicyGenerator.meta.id).toBe(
        "legal/privacy-policy-generator"
      );
      expect(privacyPolicyGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate default privacy policy", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("# Privacy Policy");
        expect(output).toContain("Company Name");
        expect(output).toContain("https://example.com");
        expect(output).toContain("2025-01-01");
      }
    });

    it("should include personal data section by default", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Information We Collect");
        expect(output).toContain("Name and email address");
        expect(output).toContain("IP address");
      }
    });

    it("should include cookies section by default", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("## Cookies");
      }
    });

    it("should include analytics section by default", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("## Analytics");
      }
    });

    it("should include newsletter section when enabled", async () => {
      const result = await executeTool(privacyPolicyGenerator, {
        hasNewsletter: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("newsletters");
      }
    });

    it("should not include newsletter section by default", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).not.toContain("newsletters");
      }
    });

    it("should use custom company details", async () => {
      const result = await executeTool(privacyPolicyGenerator, {
        companyName: "My Startup",
        websiteUrl: "https://mystartup.io",
        email: "legal@mystartup.io",
        effectiveDate: "2025-01-01",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("My Startup");
        expect(output).toContain("https://mystartup.io");
        expect(output).toContain("legal@mystartup.io");
        expect(output).toContain("2025-01-01");
      }
    });

    it("should include user rights section", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Your Rights");
        expect(output).toContain("Access the personal data");
        expect(output).toContain("Request deletion");
      }
    });

    it("should include legal disclaimer", async () => {
      const result = await executeTool(privacyPolicyGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Consult a legal professional");
      }
    });
  });
});
