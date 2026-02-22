import { describe, it, expect } from "vitest";
import { soundexGenerator } from "../../../src/tools/text/soundex-generator";
import { executeTool } from "../../../src/core/executor";

describe("soundexGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(soundexGenerator.meta.id).toBe("text/soundex-generator");
      expect(soundexGenerator.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    it("should generate soundex code for Robert", async () => {
      const result = await executeTool(soundexGenerator, { input: "Robert" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Robert: R163");
      }
    });

    it("should generate soundex code for Rupert", async () => {
      const result = await executeTool(soundexGenerator, { input: "Rupert" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Rupert: R163");
      }
    });

    it("should produce same code for similar sounding names", async () => {
      const result1 = await executeTool(soundexGenerator, { input: "Robert" });
      const result2 = await executeTool(soundexGenerator, { input: "Rupert" });
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (result1.success && result2.success) {
        const code1 = ((result1.data as Record<string, unknown>).output as string)
          .split(":")[1]!
          .trim();
        const code2 = ((result2.data as Record<string, unknown>).output as string)
          .split(":")[1]!
          .trim();
        expect(code1).toBe(code2);
      }
    });

    it("should handle multiple words", async () => {
      const result = await executeTool(soundexGenerator, {
        input: "John Smith",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const lines = output.split("\n");
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain("John:");
        expect(lines[1]).toContain("Smith:");
      }
    });

    it("should pad short codes with zeros", async () => {
      const result = await executeTool(soundexGenerator, { input: "A" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const code = output.split(":")[1]!.trim();
        expect(code).toBe("A000");
        expect(code.length).toBe(4);
      }
    });

    it("should limit code to 4 characters", async () => {
      const result = await executeTool(soundexGenerator, {
        input: "Washington",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const code = output.split(":")[1]!.trim();
        expect(code.length).toBe(4);
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(soundexGenerator, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only input", async () => {
      const result = await executeTool(soundexGenerator, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
