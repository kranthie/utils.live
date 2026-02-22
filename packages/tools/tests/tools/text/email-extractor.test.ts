import { describe, it, expect } from "vitest";
import { emailExtractor } from "../../../src/tools/text/email-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("emailExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(emailExtractor.meta.id).toBe("text/email-extractor");
      expect(emailExtractor.meta.name).toBe("Email Extractor");
      expect(emailExtractor.meta.category).toBe("text");
      expect(emailExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(emailExtractor.meta.keywords).toContain("email");
      expect(emailExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract single email", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Contact us at test@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "test@example.com"
        );
      }
    });

    it("should extract multiple emails", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Email john@test.com or jane@test.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "john@test.com"
        );
        expect((result.data as Record<string, unknown>).emails).toContain(
          "jane@test.com"
        );
      }
    });

    it("should extract unique emails by default", async () => {
      const result = await executeTool(emailExtractor, {
        input: "test@example.com and test@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should return non-unique emails when option is false", async () => {
      const result = await executeTool(
        emailExtractor,
        { input: "test@example.com and test@example.com" },
        { unique: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should convert to lowercase by default", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Contact TEST@EXAMPLE.COM",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).emails).toContain(
          "test@example.com"
        );
      }
    });

    it("should preserve case when lowercase option is false", async () => {
      const result = await executeTool(
        emailExtractor,
        { input: "Contact TEST@EXAMPLE.COM" },
        { lowercase: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).emails).toContain(
          "TEST@EXAMPLE.COM"
        );
      }
    });

    it("should extract domains", async () => {
      const result = await executeTool(emailExtractor, {
        input: "john@gmail.com and jane@yahoo.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).domains).toContain(
          "gmail.com"
        );
        expect((result.data as Record<string, unknown>).domains).toContain(
          "yahoo.com"
        );
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(emailExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).emails).toEqual([]);
      }
    });

    it("should handle input with no emails", async () => {
      const result = await executeTool(emailExtractor, {
        input: "This text has no email addresses",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should handle emails with subdomains", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Contact support@mail.example.co.uk",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "support@mail.example.co.uk"
        );
      }
    });

    it("should handle emails with numbers", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Email: user123@test456.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "user123@test456.com"
        );
      }
    });

    it("should handle emails with dots in local part", async () => {
      const result = await executeTool(emailExtractor, {
        input: "john.doe@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "john.doe@example.com"
        );
      }
    });

    it("should handle emails with plus sign", async () => {
      const result = await executeTool(emailExtractor, {
        input: "user+tag@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).emails).toContain(
          "user+tag@example.com"
        );
      }
    });

    it("should handle emails with underscores", async () => {
      const result = await executeTool(emailExtractor, {
        input: "user_name@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(emailExtractor, {
        input: "First: a@test.com\nSecond: b@test.com\nThird: c@test.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should not extract invalid emails", async () => {
      const result = await executeTool(emailExtractor, {
        input: "Not an email: user@, @domain.com, user@.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });
  });
});
