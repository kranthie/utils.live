import { describe, it, expect } from "vitest";
import { morseCode } from "../../../src/tools/encoding/morse-code";
import { executeTool } from "../../../src/core/executor";

describe("morseCode", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(morseCode.meta.id).toBe("encoding/morse-code");
      expect(morseCode.meta.category).toBe("encoding");
    });
  });

  describe("execute", () => {
    it("should convert text to morse code", async () => {
      const result = await executeTool(morseCode, { input: "SOS" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("... --- ...");
      }
    });

    it("should convert text with spaces to morse code", async () => {
      const result = await executeTool(morseCode, { input: "HI THERE" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain(".... ..");
        expect(output).toContain("/");
      }
    });

    it("should convert numbers to morse code", async () => {
      const result = await executeTool(morseCode, { input: "123" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe(".---- ..--- ...--");
      }
    });

    it("should convert from morse code to text", async () => {
      const result = await executeTool(
        morseCode,
        { input: "... --- ..." },
        { direction: "from-morse" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("SOS");
      }
    });

    it("should convert morse with word separators", async () => {
      const result = await executeTool(
        morseCode,
        { input: ".... .. / - .... . .-. ." },
        { direction: "from-morse" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("HI THERE");
      }
    });

    it("should be case insensitive for to-morse", async () => {
      const result1 = await executeTool(morseCode, { input: "hello" });
      const result2 = await executeTool(morseCode, { input: "HELLO" });
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

    it("should handle punctuation", async () => {
      const result = await executeTool(morseCode, { input: "HELLO!" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("-.-.--");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(morseCode, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only input", async () => {
      const result = await executeTool(morseCode, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
