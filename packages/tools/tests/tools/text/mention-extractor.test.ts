import { describe, it, expect } from "vitest";
import { mentionExtractor } from "../../../src/tools/text/mention-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("mentionExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(mentionExtractor.meta.id).toBe("text/mention-extractor");
      expect(mentionExtractor.meta.name).toBe("Mention Extractor");
      expect(mentionExtractor.meta.category).toBe("text");
      expect(mentionExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(mentionExtractor.meta.keywords).toContain("mention");
      expect(mentionExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract single mention", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "Hey @john, how are you?",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@john"
        );
        expect((result.data as Record<string, unknown>).usernames).toContain(
          "john"
        );
      }
    });

    it("should extract multiple mentions", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@alice and @bob are talking with @charlie",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@alice"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@bob"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@charlie"
        );
      }
    });

    it("should return unique mentions by default", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@john @john @john",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).unique.length).toBe(1);
      }
    });

    it("should return non-unique mentions when option is false", async () => {
      const result = await executeTool(
        mentionExtractor,
        { input: "@john @john @john" },
        { unique: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect((result.data as Record<string, unknown>).unique.length).toBe(1);
      }
    });

    it("should convert to lowercase when option is true", async () => {
      const result = await executeTool(
        mentionExtractor,
        { input: "@John @JANE @Bob" },
        { lowercase: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@john"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@jane"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@bob"
        );
      }
    });

    it("should preserve case when lowercase option is false", async () => {
      const result = await executeTool(
        mentionExtractor,
        { input: "@John @JANE @Bob" },
        { lowercase: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@John"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@JANE"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@Bob"
        );
      }
    });

    it("should include @ by default", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@user",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mentions[0]).toBe(
          "@user"
        );
      }
    });

    it("should exclude @ when includeAt is false", async () => {
      const result = await executeTool(
        mentionExtractor,
        { input: "@user @admin" },
        { includeAt: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "user"
        );
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "admin"
        );
        expect((result.data as Record<string, unknown>).mentions).not.toContain(
          "@user"
        );
      }
    });

    it("should return usernames without @ in usernames array", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@alice @bob",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).usernames).toContain(
          "alice"
        );
        expect((result.data as Record<string, unknown>).usernames).toContain(
          "bob"
        );
        expect(
          (
            (result.data as Record<string, unknown>).usernames as string[]
          ).every((u: string) => !u.startsWith("@"))
        ).toBe(true);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(mentionExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).mentions).toEqual([]);
      }
    });

    it("should handle input with no mentions", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "This text has no mentions",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should extract mentions with numbers", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@user123 @test456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@user123"
        );
      }
    });

    it("should extract mentions with underscores", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@user_name @test_user",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@user_name"
        );
      }
    });

    it("should not extract mentions starting with numbers", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@123user @456test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Mentions must start with a letter
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@first\n@second\n@third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should handle mentions at end of text", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "Check this out @user",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).mentions).toContain(
          "@user"
        );
      }
    });

    it("should handle adjacent mentions", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "@one@two@three",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should handle email-like patterns", async () => {
      const result = await executeTool(mentionExtractor, {
        input: "Contact user@example.com or @support",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should extract the @example and @support parts
        expect(
          (result.data as Record<string, unknown>).count
        ).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
