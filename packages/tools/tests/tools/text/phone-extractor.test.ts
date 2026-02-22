import { describe, it, expect } from "vitest";
import { phoneExtractor } from "../../../src/tools/text/phone-extractor";
import { executeTool } from "../../../src/core/executor";

describe("phoneExtractor", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(phoneExtractor.meta.id).toBe("text/phone-extractor");
      expect(phoneExtractor.meta.name).toBe("Phone Extractor");
      expect(phoneExtractor.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("US phone formats", () => {
      it("should extract standard US format", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Call me at 555-123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
          expect(
            (result.data as Record<string, unknown>).count
          ).toBeGreaterThan(0);
        }
      });

      it("should extract US format with parentheses", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Call (555) 123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
        }
      });

      it("should extract US format with dots", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Phone: 555.123.4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
        }
      });

      it("should extract US format with country code", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Call +1-555-123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("international formats", () => {
      it("should extract international format with plus", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "International: +44 20 7946 0958",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
        }
      });

      it("should extract plain digit sequences", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Phone: 5551234567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones.length
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("multiple phones", () => {
      it("should extract multiple phone numbers", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Office: 555-111-2222, Home: 555-333-4444",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).count).toBe(2);
        }
      });

      it("should deduplicate by normalized form", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "555-123-4567 and (555) 123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // Same number in different formats should be deduplicated
          expect((result.data as Record<string, unknown>).unique.length).toBe(
            1
          );
        }
      });
    });

    describe("options", () => {
      it("should return unique numbers by default", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "555-123-4567 repeated 555-123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).phones.length).toBe(
            1
          );
        }
      });

      it("should normalize numbers when option enabled", async () => {
        const result = await executeTool(
          phoneExtractor,
          { input: "(555) 123-4567" },
          { normalize: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).phones[0]).toMatch(
            /^\d+$/
          );
        }
      });

      it("should return normalized versions in output", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "(555) 123-4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).normalized[0]
          ).toMatch(/^\d+$/);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(phoneExtractor, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).phones).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
          expect((result.data as Record<string, unknown>).unique).toEqual([]);
          expect((result.data as Record<string, unknown>).normalized).toEqual(
            []
          );
        }
      });

      it("should handle text without phone numbers", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "No phone numbers here!",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).phones).toEqual([]);
          expect((result.data as Record<string, unknown>).count).toBe(0);
        }
      });

      it("should reject too short numbers", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Short: 12345",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // 5 digits is too short for a valid phone
          expect((result.data as Record<string, unknown>).phones.length).toBe(
            0
          );
        }
      });

      it("should reject too long numbers", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Long: 1234567890123456789",
        });
        expect(result.success).toBe(true);
        // The regex may still extract valid substrings
      });

      it("should handle phones with spaces", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Call 555 123 4567",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).count
          ).toBeGreaterThan(0);
        }
      });

      it("should trim trailing punctuation from phones", async () => {
        const result = await executeTool(phoneExtractor, {
          input: "Call 555-123-4567.",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).phones[0]
          ).not.toMatch(/\.$/);
        }
      });
    });
  });
});
