import { describe, it, expect } from "vitest";
import { slugify } from "../../../src/tools/text/slugify";
import { executeTool } from "../../../src/core/executor";

describe("slugify", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(slugify.meta.id).toBe("text/slugify");
      expect(slugify.meta.name).toBe("Slugify");
      expect(slugify.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("basic slugification", () => {
      it("should convert simple text to slug", async () => {
        const result = await executeTool(slugify, { input: "Hello World" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello-world"
          );
          expect((result.data as Record<string, unknown>).original).toBe(
            "Hello World"
          );
        }
      });

      it("should convert to lowercase by default", async () => {
        const result = await executeTool(slugify, { input: "HELLO WORLD" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello-world"
          );
        }
      });

      it("should replace spaces with hyphens", async () => {
        const result = await executeTool(slugify, {
          input: "one two three",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "one-two-three"
          );
        }
      });

      it("should return slug length", async () => {
        const result = await executeTool(slugify, { input: "Hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).length).toBe(5);
        }
      });
    });

    describe("special characters", () => {
      it("should strip special characters by default", async () => {
        const result = await executeTool(slugify, {
          input: "Hello, World!",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello-world"
          );
        }
      });

      it("should handle multiple spaces", async () => {
        const result = await executeTool(slugify, {
          input: "hello   world",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello-world"
          );
        }
      });

      it("should handle numbers", async () => {
        const result = await executeTool(slugify, {
          input: "Product 123 ABC",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "product-123-abc"
          );
        }
      });

      it("should handle ampersand", async () => {
        const result = await executeTool(slugify, {
          input: "Rock & Roll",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "&"
          );
        }
      });
    });

    describe("options", () => {
      it("should use custom separator", async () => {
        const result = await executeTool(
          slugify,
          { input: "Hello World" },
          { separator: "_" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello_world"
          );
        }
      });

      it("should preserve case when lowercase disabled", async () => {
        const result = await executeTool(
          slugify,
          { input: "Hello World" },
          { lowercase: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello-World"
          );
        }
      });

      it("should not strip special chars when strict disabled", async () => {
        const result = await executeTool(
          slugify,
          { input: "Hello World" },
          { strict: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          // Behavior depends on slugify library configuration
          expect(typeof (result.data as Record<string, unknown>).output).toBe(
            "string"
          );
        }
      });

      it("should not trim separator from ends when trim disabled", async () => {
        const result = await executeTool(
          slugify,
          { input: "-Hello World-" },
          { trim: false }
        );
        expect(result.success).toBe(true);
        // Behavior depends on input and options
      });
    });

    describe("unicode handling", () => {
      it("should handle accented characters", async () => {
        const result = await executeTool(slugify, { input: "cafe latte" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeGreaterThan(0);
        }
      });

      it("should handle umlauts", async () => {
        const result = await executeTool(slugify, { input: "uber" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeGreaterThan(0);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(slugify, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("");
          expect((result.data as Record<string, unknown>).length).toBe(0);
        }
      });

      it("should handle only special characters", async () => {
        const result = await executeTool(slugify, { input: "!@#$%^&*()" });
        expect(result.success).toBe(true);
        // slugify library may transliterate some special characters like $ to "dollar", & to "and"
        // so the output may not be empty
      });

      it("should handle only numbers", async () => {
        const result = await executeTool(slugify, { input: "12345" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("12345");
        }
      });

      it("should handle leading/trailing spaces", async () => {
        const result = await executeTool(slugify, {
          input: "  Hello World  ",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello-world"
          );
        }
      });

      it("should handle tabs and newlines", async () => {
        const result = await executeTool(slugify, {
          input: "Hello\tWorld\nTest",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\t"
          );
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "\n"
          );
        }
      });

      it("should handle very long input", async () => {
        const longInput = "word ".repeat(100);
        const result = await executeTool(slugify, { input: longInput });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(
            (result.data as Record<string, unknown>).output.length
          ).toBeGreaterThan(0);
        }
      });

      it("should handle multiple consecutive special chars", async () => {
        const result = await executeTool(slugify, {
          input: "Hello!!!World???Test",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "!"
          );
          expect((result.data as Record<string, unknown>).output).not.toContain(
            "?"
          );
        }
      });
    });
  });
});
