import { describe, it, expect } from "vitest";
import { gdprStatementGenerator } from "../../../src/tools/legal/gdpr-statement-generator";
import { executeTool } from "../../../src/core/executor";

describe("gdprStatementGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gdprStatementGenerator.meta.id).toBe("legal/gdpr-statement-generator");
      expect(gdprStatementGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate default GDPR statement", async () => {
      const result = await executeTool(gdprStatementGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("GDPR Compliance Statement");
        expect(output).toContain("Company Name");
        expect(output).toContain("Germany");
        expect(output).toContain("dpo@example.com");
        expect(output).toContain("name, email, IP address");
      }
    });

    it("should include all GDPR rights", async () => {
      const result = await executeTool(gdprStatementGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Right of Access");
        expect(output).toContain("Right to Rectification");
        expect(output).toContain("Right to Erasure");
        expect(output).toContain("Right to Restrict Processing");
        expect(output).toContain("Right to Data Portability");
        expect(output).toContain("Right to Object");
        expect(output).toContain("Automated Decision-Making");
      }
    });

    it("should include legal basis section", async () => {
      const result = await executeTool(gdprStatementGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Legal Basis for Processing");
        expect(output).toContain("Consent");
        expect(output).toContain("Contract");
        expect(output).toContain("Legitimate interests");
      }
    });

    it("should use custom company details", async () => {
      const result = await executeTool(gdprStatementGenerator, {
        companyName: "Data Corp",
        email: "privacy@datacorp.eu",
        country: "France",
        dataTypes: "name, email, phone number, location",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Data Corp");
        expect(output).toContain("France");
        expect(output).toContain("privacy@datacorp.eu");
        expect(output).toContain("name, email, phone number, location");
      }
    });

    it("should include data breach notification section", async () => {
      const result = await executeTool(gdprStatementGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Data Breach Notification");
        expect(output).toContain("72 hours");
      }
    });

    it("should include supervisory authority section", async () => {
      const result = await executeTool(gdprStatementGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Supervisory Authority");
      }
    });
  });
});
