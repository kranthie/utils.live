import { describe, it, expect } from "vitest";
import { languageCodeReference } from "../../../src/tools/reference/language-code-reference";
import { executeTool } from "../../../src/core/executor";

describe("languageCodeReference", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(languageCodeReference.meta.id).toBe("reference/language-code-reference");
      expect(languageCodeReference.meta.category).toBe("reference");
    });
  });

  describe("execute", () => {
    it("should return all language codes without filter", async () => {
      const result = await executeTool(languageCodeReference, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("ISO1");
        expect(output).toContain("ISO2");
        expect(output).toContain("English");
        expect(output).toContain("Spanish");
        expect(output).toContain("French");
      }
    });

    it("should filter by language name", async () => {
      const result = await executeTool(languageCodeReference, {
        filter: "german",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("German");
        expect(output).toContain("de");
        expect(output).toContain("deu");
        expect(output).not.toContain("English");
      }
    });

    it("should filter by ISO1 code", async () => {
      const result = await executeTool(languageCodeReference, { filter: "ja" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Japanese");
      }
    });

    it("should filter by ISO2 code", async () => {
      const result = await executeTool(languageCodeReference, {
        filter: "spa",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Spanish");
      }
    });

    it("should return header only for no matches", async () => {
      const result = await executeTool(languageCodeReference, {
        filter: "xyznonexistent",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const lines = output.split("\n");
        expect(lines.length).toBe(2);
      }
    });

    it("should include less common languages", async () => {
      const result = await executeTool(languageCodeReference, {
        filter: "latin",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Latin");
        expect(output).toContain("la");
      }
    });
  });
});
