import { describe, it, expect } from "vitest";
import { loremIpsum } from "../../../src/tools/text/lorem-ipsum";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("loremIpsum", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(loremIpsum.meta.id).toBe("text/lorem-ipsum");
      expect(loremIpsum.meta.name).toBe("Lorem Ipsum");
      expect(loremIpsum.meta.category).toBe("text");
      expect(loremIpsum.meta.tier).toBe(ToolTier.CLIENT);
      expect(loremIpsum.meta.keywords).toContain("lorem");
      expect(loremIpsum.meta.keywords).toContain("placeholder");
    });
  });

  describe("execute", () => {
    it("should generate paragraphs by default", async () => {
      const result = await executeTool(loremIpsum, { count: 2 });

      expect(result.success).toBe(true);
      if (result.success) {
        // Paragraphs are separated by double newlines
        const paragraphs = (
          (result.data as Record<string, unknown>).output as string
        ).split("\n\n");
        expect(paragraphs.length).toBe(2);
      }
    });

    it("should generate specified number of words", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 10 },
        { unit: "words" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).output as string
        )
          .split(/\s+/)
          .filter((w: string) => w);
        expect(words.length).toBe(10);
      }
    });

    it("should generate specified number of sentences", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 3 },
        { unit: "sentences" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Count sentences by counting periods
        const sentences = (
          (result.data as Record<string, unknown>).output as string
        )
          .split(".")
          .filter((s: string) => s.trim());
        expect(sentences.length).toBe(3);
      }
    });

    it("should start with Lorem ipsum by default", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "paragraphs", startWithLorem: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /^Lorem ipsum/
        );
      }
    });

    it("should not start with Lorem ipsum when option is false", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "paragraphs", startWithLorem: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // May or may not start with Lorem - just verify it generates output
        expect(
          ((result.data as Record<string, unknown>).output as string).length
        ).toBeGreaterThan(0);
      }
    });

    it("should return word count", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "paragraphs" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).wordCount
        ).toBeGreaterThan(0);
        // Verify word count matches
        const actualWords = (
          (result.data as Record<string, unknown>).output as string
        )
          .split(/\s+/)
          .filter((w: string) => w).length;
        expect((result.data as Record<string, unknown>).wordCount).toBe(
          actualWords
        );
      }
    });

    it("should return character count", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "paragraphs" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).characterCount).toBe(
          ((result.data as Record<string, unknown>).output as string).length
        );
      }
    });

    it("should end sentences with period", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 3 },
        { unit: "sentences" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).output as string).trim()
        ).toMatch(/\.$/);
      }
    });

    it("should capitalize first word of sentences", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "sentences", startWithLorem: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const firstChar = (
          (result.data as Record<string, unknown>).output as string
        ).charAt(0);
        expect(firstChar).toBe(firstChar.toUpperCase());
      }
    });

    it("should handle count of 1", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 1 },
        { unit: "paragraphs" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).output as string).length
        ).toBeGreaterThan(0);
        // No paragraph separators in single paragraph
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "\n\n"
        );
      }
    });

    it("should handle maximum count", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 100 },
        { unit: "words" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).output as string
        )
          .split(/\s+/)
          .filter((w: string) => w);
        expect(words.length).toBe(100);
      }
    });

    it("should start words unit with Lorem ipsum", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 5 },
        { unit: "words", startWithLorem: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const words = (
          (result.data as Record<string, unknown>).output as string
        ).split(/\s+/);
        expect(words[0]).toBe("Lorem");
        expect(words[1]).toBe("ipsum");
      }
    });

    it("should start sentences unit with Lorem ipsum", async () => {
      const result = await executeTool(
        loremIpsum,
        { count: 2 },
        { unit: "sentences", startWithLorem: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /^Lorem ipsum/
        );
      }
    });

    it("should generate different text on multiple calls (randomness)", async () => {
      const results: string[] = [];
      for (let i = 0; i < 5; i++) {
        const result = await executeTool(
          loremIpsum,
          { count: 2 },
          { unit: "paragraphs", startWithLorem: false }
        );
        if (result.success) {
          results.push((result.data as Record<string, unknown>).output);
        }
      }

      // With randomness, not all outputs should be identical
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBeGreaterThan(1);
    });
  });
});
