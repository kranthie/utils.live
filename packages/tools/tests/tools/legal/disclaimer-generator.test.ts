import { describe, it, expect } from "vitest";
import { disclaimerGenerator } from "../../../src/tools/legal/disclaimer-generator";
import { executeTool } from "../../../src/core/executor";

describe("disclaimerGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(disclaimerGenerator.meta.id).toBe("legal/disclaimer-generator");
      expect(disclaimerGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate general disclaimer by default", async () => {
      const result = await executeTool(disclaimerGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Disclaimer");
        expect(output).toContain("General Disclaimer");
        expect(output).toContain("informational purposes");
      }
    });

    it("should generate blog disclaimer", async () => {
      const result = await executeTool(disclaimerGenerator, { type: "blog" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Blog Disclaimer");
        expect(output).toContain("views and opinions");
      }
    });

    it("should generate affiliate disclaimer", async () => {
      const result = await executeTool(disclaimerGenerator, {
        type: "affiliate",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Affiliate Disclaimer");
        expect(output).toContain("affiliate links");
      }
    });

    it("should generate professional disclaimer", async () => {
      const result = await executeTool(disclaimerGenerator, {
        type: "professional",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Professional Disclaimer");
        expect(output).toContain("professional advice");
      }
    });

    it("should generate medical disclaimer", async () => {
      const result = await executeTool(disclaimerGenerator, {
        type: "medical",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Medical Disclaimer");
        expect(output).toContain("physician");
      }
    });

    it("should generate financial disclaimer", async () => {
      const result = await executeTool(disclaimerGenerator, {
        type: "financial",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Financial Disclaimer");
        expect(output).toContain("financial advisor");
      }
    });

    it("should use custom company name and URL", async () => {
      const result = await executeTool(disclaimerGenerator, {
        companyName: "Tech Corp",
        websiteUrl: "https://techcorp.io",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Tech Corp");
        expect(output).toContain("https://techcorp.io");
      }
    });

    it("should include legal disclaimer footer", async () => {
      const result = await executeTool(disclaimerGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Consult a legal professional");
      }
    });
  });
});
