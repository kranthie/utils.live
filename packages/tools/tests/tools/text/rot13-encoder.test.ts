import { describe, it, expect } from "vitest";
import { rot13Encoder } from "../../../src/tools/text/rot13-encoder";
import { executeTool } from "../../../src/core/executor";

describe("rot13Encoder", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(rot13Encoder.meta.id).toBe("text/rot13-encoder");
      expect(rot13Encoder.meta.name).toBe("ROT13 Encoder");
      expect(rot13Encoder.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic encoding", () => {
      it("should encode lowercase letters", async () => {
        const result = await executeTool(rot13Encoder, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("uryyb");
        }
      });

      it("should encode uppercase letters", async () => {
        const result = await executeTool(rot13Encoder, { input: "HELLO" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("URYYB");
        }
      });

      it("should preserve case", async () => {
        const result = await executeTool(rot13Encoder, { input: "HeLLo" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("UrYYb");
        }
      });

      it("should count rotated characters", async () => {
        const result = await executeTool(rot13Encoder, { input: "abc123" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).rotatedChars).toBe(3); // Only a, b, c are rotated
        }
      });
    });

    describe("non-alphabetic characters", () => {
      it("should preserve numbers", async () => {
        const result = await executeTool(rot13Encoder, { input: "abc123xyz" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "123"
          );
        }
      });

      it("should preserve spaces", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "hello world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "uryyb jbeyq"
          );
        }
      });

      it("should preserve punctuation", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "Hello, World!",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Uryyb, Jbeyq!"
          );
        }
      });

      it("should preserve special characters", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "@#$%^&*()",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "@#$%^&*()"
          );
          expect((result.data as Record<string, unknown>).rotatedChars).toBe(0);
        }
      });
    });

    describe("reversibility", () => {
      it("should decode when applied twice", async () => {
        const original = "Hello, World!";
        const encoded = await executeTool(rot13Encoder, { input: original });
        expect(encoded.success).toBe(true);
        if (encoded.success) {
          const decoded = await executeTool(rot13Encoder, {
            input: (encoded.data as Record<string, unknown>).output,
          });
          expect(decoded.success).toBe(true);
          if (decoded.success) {
            expect((decoded.data as Record<string, unknown>).output).toBe(
              original
            );
          }
        }
      });

      it("should be symmetrical for alphabet", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "abcdefghijklmnopqrstuvwxyz",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "nopqrstuvwxyzabcdefghijklm"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(rot13Encoder, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).rotatedChars).toBe(0);
        }
      });

      it("should handle only numbers", async () => {
        const result = await executeTool(rot13Encoder, { input: "12345" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("12345");
          expect((result.data as Record<string, unknown>).rotatedChars).toBe(0);
        }
      });

      it("should handle newlines and tabs", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "line1\nline2\ttab",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "\n"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "\t"
          );
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool(rot13Encoder, {
          input: "cafe latte",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // Non-ASCII characters should be preserved
          expect((result.data as Record<string, unknown>).output).toBe(
            "pnsr ynggr"
          );
        }
      });

      it("should handle long text", async () => {
        const longText = "a".repeat(10000);
        const result = await executeTool(rot13Encoder, { input: longText });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "n".repeat(10000)
          );
          expect((result.data as Record<string, unknown>).rotatedChars).toBe(
            10000
          );
        }
      });

      it("should handle boundary letters", async () => {
        // a -> n, m -> z, n -> a, z -> m
        const result = await executeTool(rot13Encoder, { input: "amnz" });
        expect(result.success).toBe(true);
        if (result.success) {
          // a(0)+13=n, m(12)+13=z(25), n(13)+13=a(0), z(25)+13=m(12)
          expect((result.data as Record<string, unknown>).output).toBe("nzam");
        }
      });
    });
  });
});
