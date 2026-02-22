import { describe, it, expect } from "vitest";
import { hashtagExtractor } from "../../../src/tools/text/hashtag-extractor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("hashtagExtractor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(hashtagExtractor.meta.id).toBe("text/hashtag-extractor");
      expect(hashtagExtractor.meta.name).toBe("Hashtag Extractor");
      expect(hashtagExtractor.meta.category).toBe("text");
      expect(hashtagExtractor.meta.tier).toBe(ToolTier.CLIENT);
      expect(hashtagExtractor.meta.keywords).toContain("hashtag");
      expect(hashtagExtractor.meta.keywords).toContain("extract");
    });
  });

  describe("execute", () => {
    it("should extract single hashtag", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "Check out #javascript",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#javascript"
        );
        expect((result.data as Record<string, unknown>).tags).toContain(
          "javascript"
        );
      }
    });

    it("should extract multiple hashtags", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#typescript #react #nodejs",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#typescript"
        );
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#react"
        );
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#nodejs"
        );
      }
    });

    it("should return unique hashtags by default", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#test #test #test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(1);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should return non-unique hashtags when option is false", async () => {
      const result = await executeTool(
        hashtagExtractor,
        { input: "#test #test #test" },
        { unique: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
        expect(
          ((result.data as Record<string, unknown>).unique as unknown[]).length
        ).toBe(1);
      }
    });

    it("should convert to lowercase when option is true", async () => {
      const result = await executeTool(
        hashtagExtractor,
        { input: "#JavaScript #REACT" },
        { lowercase: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#javascript"
        );
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#react"
        );
      }
    });

    it("should preserve case when lowercase option is false", async () => {
      const result = await executeTool(
        hashtagExtractor,
        { input: "#JavaScript #REACT" },
        { lowercase: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#JavaScript"
        );
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#REACT"
        );
      }
    });

    it("should exclude # when includeHash is false", async () => {
      const result = await executeTool(
        hashtagExtractor,
        { input: "#javascript #react" },
        { includeHash: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "javascript"
        );
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "react"
        );
        expect((result.data as Record<string, unknown>).hashtags).not.toContain(
          "#javascript"
        );
      }
    });

    it("should include # by default", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).hashtags as unknown[])[0]
        ).toBe("#test");
      }
    });

    it("should extract tags without # in tags array", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#javascript #react",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).tags).toContain(
          "javascript"
        );
        expect((result.data as Record<string, unknown>).tags).toContain(
          "react"
        );
        expect(
          ((result.data as Record<string, unknown>).tags as string[]).every(
            (t: string) => !t.startsWith("#")
          )
        ).toBe(true);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(hashtagExtractor, { input: "" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
        expect((result.data as Record<string, unknown>).hashtags).toEqual([]);
      }
    });

    it("should handle input with no hashtags", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "This text has no hashtags",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should extract hashtags with numbers", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#test123 #abc456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#test123"
        );
      }
    });

    it("should extract hashtags with underscores", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#my_hashtag #another_one",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(2);
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#my_hashtag"
        );
      }
    });

    it("should not extract hashtags starting with numbers", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#123test #456",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Hashtags must start with a letter
        expect((result.data as Record<string, unknown>).count).toBe(0);
      }
    });

    it("should handle multiline input", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#first\n#second\n#third",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });

    it("should handle hashtags at end of text", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "Check this out #amazing",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hashtags).toContain(
          "#amazing"
        );
      }
    });

    it("should handle adjacent hashtags", async () => {
      const result = await executeTool(hashtagExtractor, {
        input: "#one#two#three",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).count).toBe(3);
      }
    });
  });
});
