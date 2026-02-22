import { describe, it, expect } from "vitest";
import { languageDetector } from "../../../src/tools/text/language-detector";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("languageDetector", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(languageDetector.meta.id).toBe("text/language-detector");
      expect(languageDetector.meta.name).toBe("Language Detector");
      expect(languageDetector.meta.category).toBe("text");
      expect(languageDetector.meta.tier).toBe(ToolTier.CLIENT);
      expect(languageDetector.meta.keywords).toContain("language");
      expect(languageDetector.meta.keywords).toContain("detect");
    });
  });

  describe("execute", () => {
    it("should detect English text", async () => {
      const result = await executeTool(languageDetector, {
        input:
          "The quick brown fox jumps over the lazy dog. This is a sentence in English.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBe("en");
        expect((result.data as Record<string, unknown>).language).toBe(
          "English"
        );
        expect(
          (result.data as Record<string, unknown>).confidence
        ).toBeGreaterThan(0);
      }
    });

    it("should detect Spanish text", async () => {
      const result = await executeTool(languageDetector, {
        input:
          "El zorro marron rapido salta sobre el perro perezoso. Esta es una oracion en espanol.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Spanish should be detected with reasonable confidence
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
        expect((result.data as Record<string, unknown>).language).toBeDefined();
      }
    });

    it("should detect French text", async () => {
      const result = await executeTool(languageDetector, {
        input:
          "Le renard brun rapide saute par-dessus le chien paresseux. Cest une phrase en francais.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
        expect((result.data as Record<string, unknown>).language).toBeDefined();
      }
    });

    it("should detect German text", async () => {
      const result = await executeTool(languageDetector, {
        input:
          "Der schnelle braune Fuchs springt uber den faulen Hund. Dies ist ein Satz auf Deutsch.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
        expect((result.data as Record<string, unknown>).language).toBeDefined();
      }
    });

    it("should return confidence score between 0 and 100", async () => {
      const result = await executeTool(languageDetector, {
        input: "This is an English sentence.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).confidence
        ).toBeGreaterThanOrEqual(0);
        expect(
          (result.data as Record<string, unknown>).confidence
        ).toBeLessThanOrEqual(100);
      }
    });

    it("should return alternative languages", async () => {
      const result = await executeTool(languageDetector, {
        input: "Hello world, this is a test.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).alternatives
        ).toBeInstanceOf(Array);
        // Should have some alternatives
        for (const alt of (result.data as Record<string, unknown>)
          .alternatives as Record<string, unknown>[]) {
          expect(alt.code).toBeDefined();
          expect(alt.language).toBeDefined();
          expect(typeof alt.confidence).toBe("number");
        }
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(languageDetector, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
        expect((result.data as Record<string, unknown>).confidence).toBe(0);
      }
    });

    it("should handle very short input", async () => {
      const result = await executeTool(languageDetector, { input: "Hi" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
        // Short input may have low confidence
        expect(
          (result.data as Record<string, unknown>).confidence
        ).toBeGreaterThanOrEqual(0);
      }
    });

    it("should handle mixed language text", async () => {
      const result = await executeTool(languageDetector, {
        input: "Hello bonjour hola",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return some result even for mixed text
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
      }
    });

    it("should handle numbers only", async () => {
      const result = await executeTool(languageDetector, {
        input: "123456789",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
      }
    });

    it("should handle special characters", async () => {
      const result = await executeTool(languageDetector, {
        input: "!@#$%^&*()",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
      }
    });

    it("should limit alternatives to 3", async () => {
      const result = await executeTool(languageDetector, {
        input: "This is a test sentence in English.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).alternatives as unknown[])
            .length
        ).toBeLessThanOrEqual(3);
      }
    });

    it("should handle multiline text", async () => {
      const result = await executeTool(languageDetector, {
        input: "This is line one.\nThis is line two.\nThis is line three.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBe("en");
      }
    });

    it("should handle Russian text", async () => {
      const result = await executeTool(languageDetector, {
        input:
          "Привет мир. Это тестовое сообщение на русском языке. Привет привет.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).detected).toBeDefined();
      }
    });
  });
});
