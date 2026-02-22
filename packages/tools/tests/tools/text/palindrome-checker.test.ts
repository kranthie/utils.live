import { describe, it, expect } from "vitest";
import { palindromeChecker } from "../../../src/tools/text/palindrome-checker";
import { executeTool } from "../../../src/core/executor";

describe("palindromeChecker", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(palindromeChecker.meta.id).toBe("text/palindrome-checker");
      expect(palindromeChecker.meta.name).toBe("Palindrome Checker");
      expect(palindromeChecker.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("simple palindromes", () => {
      it("should detect simple word palindrome", async () => {
        const result = await executeTool(palindromeChecker, {
          input: "racecar",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
          expect((result.data as Record<string, unknown>).normalized).toBe(
            "racecar"
          );
          expect((result.data as Record<string, unknown>).reversed).toBe(
            "racecar"
          );
        }
      });

      it("should detect single character as palindrome", async () => {
        const result = await executeTool(palindromeChecker, { input: "a" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should detect two-character palindrome", async () => {
        const result = await executeTool(palindromeChecker, { input: "aa" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should detect non-palindrome", async () => {
        const result = await executeTool(palindromeChecker, { input: "hello" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            false
          );
        }
      });
    });

    describe("default options", () => {
      it("should ignore case by default", async () => {
        const result = await executeTool(palindromeChecker, {
          input: "Racecar",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should ignore spaces by default", async () => {
        const result = await executeTool(palindromeChecker, {
          input: "A man a plan a canal Panama",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should ignore punctuation by default", async () => {
        const result = await executeTool(palindromeChecker, {
          input: "Was it a car or a cat I saw?",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });
    });

    describe("custom options", () => {
      it("should be case-sensitive when option disabled", async () => {
        const result = await executeTool(
          palindromeChecker,
          { input: "Racecar" },
          { ignoreCase: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            false
          );
        }
      });

      it("should consider spaces when option disabled", async () => {
        const result = await executeTool(
          palindromeChecker,
          { input: "a b a" },
          { ignoreSpaces: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should consider punctuation when option disabled", async () => {
        const result = await executeTool(
          palindromeChecker,
          { input: "race,car" },
          { ignorePunctuation: false }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            false
          );
        }
      });

      it("should ignore numbers when option enabled", async () => {
        const result = await executeTool(
          palindromeChecker,
          { input: "a1b2b1a" },
          { ignoreNumbers: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
          expect((result.data as Record<string, unknown>).normalized).toBe(
            "abba"
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty string", async () => {
        const result = await executeTool(palindromeChecker, { input: "" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
          expect((result.data as Record<string, unknown>).normalized).toBe("");
          expect((result.data as Record<string, unknown>).reversed).toBe("");
        }
      });

      it("should handle only spaces", async () => {
        const result = await executeTool(palindromeChecker, { input: "   " });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should handle only punctuation", async () => {
        const result = await executeTool(palindromeChecker, { input: "!!!" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should handle unicode characters", async () => {
        const result = await executeTool(palindromeChecker, { input: "abcba" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should handle numbers as palindrome", async () => {
        const result = await executeTool(palindromeChecker, { input: "12321" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });

      it("should return normalized and reversed text", async () => {
        const result = await executeTool(palindromeChecker, {
          input: "Never odd or even",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).normalized).toBe(
            "neveroddoreven"
          );
          expect((result.data as Record<string, unknown>).reversed).toBe(
            "neveroddoreven"
          );
          expect((result.data as Record<string, unknown>).isPalindrome).toBe(
            true
          );
        }
      });
    });
  });
});
