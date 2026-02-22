import { describe, it, expect } from "vitest";
import { natoAlphabet } from "../../../src/tools/encoding/nato-alphabet";
import { executeTool } from "../../../src/core/executor";

describe("natoAlphabet", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(natoAlphabet.meta.id).toBe("encoding/nato-alphabet");
      expect(natoAlphabet.meta.category).toBe("encoding");
    });
  });

  describe("execute", () => {
    it("should convert text to NATO phonetic alphabet", async () => {
      const result = await executeTool(natoAlphabet, { input: "ABC" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("Alpha Bravo Charlie");
      }
    });

    it("should handle spaces", async () => {
      const result = await executeTool(natoAlphabet, { input: "A B" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("Alpha (space) Bravo");
      }
    });

    it("should convert numbers", async () => {
      const result = await executeTool(natoAlphabet, { input: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("One Two Three");
      }
    });

    it("should be case insensitive", async () => {
      const result1 = await executeTool(natoAlphabet, { input: "hello" });
      const result2 = await executeTool(natoAlphabet, { input: "HELLO" });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(
          (result1.data as Record<string, unknown>).output
        ).toBe(
          (result2.data as Record<string, unknown>).output
        );
      }
    });

    it("should handle full words", async () => {
      const result = await executeTool(natoAlphabet, { input: "SOS" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("Sierra Oscar Sierra");
      }
    });

    it("should handle all 26 letters", async () => {
      const result = await executeTool(natoAlphabet, {
        input: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Alpha");
        expect(output).toContain("Zulu");
        expect(output).toContain("X-ray");
        expect(output).toContain("Yankee");
      }
    });

    it("should use 9 as Niner", async () => {
      const result = await executeTool(natoAlphabet, { input: "9" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("Niner");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(natoAlphabet, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only input", async () => {
      const result = await executeTool(natoAlphabet, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
