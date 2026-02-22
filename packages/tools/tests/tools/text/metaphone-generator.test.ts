import { describe, it, expect } from "vitest";
import { metaphoneGenerator } from "../../../src/tools/text/metaphone-generator";
import { executeTool } from "../../../src/core/executor";

describe("metaphoneGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(metaphoneGenerator.meta.id).toBe("text/metaphone-generator");
      expect(metaphoneGenerator.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    it("should generate metaphone code for a simple word", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "Smith" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Smith:");
        expect(output.split(":")[1]!.trim().length).toBeGreaterThan(0);
      }
    });

    it("should generate codes for multiple words", async () => {
      const result = await executeTool(metaphoneGenerator, {
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

    it("should handle words starting with silent letters", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "Knight" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Knight:");
        // KN- drops the K, so should start with N
        const code = output.split(":")[1]!.trim();
        expect(code[0]).toBe("N");
      }
    });

    it("should handle PH as F", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "Phone" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const code = output.split(":")[1]!.trim();
        expect(code).toContain("F");
      }
    });

    it("should handle TH as 0", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "The" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        const code = output.split(":")[1]!.trim();
        expect(code).toContain("0");
      }
    });

    it("should produce similar codes for similar sounding words", async () => {
      const result1 = await executeTool(metaphoneGenerator, { input: "Smith" });
      const result2 = await executeTool(metaphoneGenerator, { input: "Smyth" });
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

    it("should reject empty input", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only input", async () => {
      const result = await executeTool(metaphoneGenerator, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
