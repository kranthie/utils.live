import { describe, it, expect } from "vitest";
import { findReplace } from "../../../src/tools/text/find-replace";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("findReplace", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(findReplace.meta.id).toBe("text/find-replace");
      expect(findReplace.meta.name).toBe("Find & Replace");
      expect(findReplace.meta.category).toBe("text");
      expect(findReplace.meta.tier).toBe(ToolTier.CLIENT);
      expect(findReplace.meta.keywords).toContain("find");
      expect(findReplace.meta.keywords).toContain("replace");
    });
  });

  describe("execute", () => {
    it("should replace simple text", async () => {
      const result = await executeTool(findReplace, {
        input: "hello world",
        find: "world",
        replace: "universe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "hello universe"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(1);
      }
    });

    it("should replace all occurrences by default", async () => {
      const result = await executeTool(findReplace, {
        input: "cat cat cat",
        find: "cat",
        replace: "dog",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "dog dog dog"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(3);
      }
    });

    it("should replace only first occurrence when replaceAll is false", async () => {
      const result = await executeTool(
        findReplace,
        { input: "cat cat cat", find: "cat", replace: "dog" },
        { replaceAll: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "dog cat cat"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(1);
      }
    });

    it("should be case-sensitive by default", async () => {
      const result = await executeTool(findReplace, {
        input: "Hello HELLO hello",
        find: "hello",
        replace: "hi",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Hello HELLO hi"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(1);
      }
    });

    it("should be case-insensitive when option is false", async () => {
      const result = await executeTool(
        findReplace,
        { input: "Hello HELLO hello", find: "hello", replace: "hi" },
        { caseSensitive: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "hi hi hi"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(3);
      }
    });

    it("should match whole words only when option is true", async () => {
      const result = await executeTool(
        findReplace,
        { input: "cat category cats", find: "cat", replace: "dog" },
        { wholeWord: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "dog category cats"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(1);
      }
    });

    it("should use regex when option is true", async () => {
      const result = await executeTool(
        findReplace,
        { input: "abc123def456", find: "\\d+", replace: "NUM" },
        { useRegex: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "abcNUMdefNUM"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(2);
      }
    });

    it("should escape special regex characters in non-regex mode", async () => {
      const result = await executeTool(findReplace, {
        input: "price: $100",
        find: "$100",
        replace: "$200",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "price: $200"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(1);
      }
    });

    it("should return matches found", async () => {
      const result = await executeTool(findReplace, {
        input: "cat bat rat",
        find: "at",
        replace: "og",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).matches).toEqual([
          "at",
          "at",
          "at",
        ]);
      }
    });

    it("should handle empty find string", async () => {
      const result = await executeTool(findReplace, {
        input: "hello",
        find: "",
        replace: "x",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Empty regex matches between each character
        expect(
          ((result.data as Record<string, unknown>).output as string).length
        ).toBeGreaterThan(5);
      }
    });

    it("should handle empty input string", async () => {
      const result = await executeTool(findReplace, {
        input: "",
        find: "test",
        replace: "replaced",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
        expect((result.data as Record<string, unknown>).replacements).toBe(0);
      }
    });

    it("should handle replace with empty string", async () => {
      const result = await executeTool(findReplace, {
        input: "hello world",
        find: " world",
        replace: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("hello");
      }
    });

    it("should return error for invalid regex", async () => {
      const result = await executeTool(
        findReplace,
        { input: "hello world", find: "[", replace: "x" },
        { useRegex: true }
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("TEXT_REGEX_INVALID");
        expect(result.error.message).toMatch(/invalid/i);
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(findReplace, {
        input: "line1\nline2\nline3",
        find: "line",
        replace: "row",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "row1\nrow2\nrow3"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(3);
      }
    });

    it("should handle special characters in replacement", async () => {
      const result = await executeTool(findReplace, {
        input: "hello world",
        find: "world",
        replace: "world!@#$%",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "hello world!@#$%"
        );
      }
    });

    it("should handle regex capture groups", async () => {
      const result = await executeTool(
        findReplace,
        { input: "John Smith", find: "(\\w+) (\\w+)", replace: "$2, $1" },
        { useRegex: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Smith, John"
        );
      }
    });

    it("should combine case insensitive and whole word options", async () => {
      const result = await executeTool(
        findReplace,
        { input: "Cat category CATS cat", find: "cat", replace: "dog" },
        { caseSensitive: false, wholeWord: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "dog category CATS dog"
        );
        expect((result.data as Record<string, unknown>).replacements).toBe(2);
      }
    });
  });
});
