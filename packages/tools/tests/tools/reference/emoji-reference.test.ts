import { describe, it, expect } from "vitest";
import { emojiReference } from "../../../src/tools/reference/emoji-reference";
import { executeTool } from "../../../src/core/executor";

describe("emojiReference", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(emojiReference.meta.id).toBe("reference/emoji-reference");
      expect(emojiReference.meta.category).toBe("reference");
    });
  });

  describe("execute", () => {
    it("should return all emojis without filter", async () => {
      const result = await executeTool(emojiReference, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("grinning face");
        expect(output).toContain("thumbs up");
        expect(output).toContain("dog face");
      }
    });

    it("should filter by name", async () => {
      const result = await executeTool(emojiReference, { filter: "heart" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("heart");
        expect(output).not.toContain("grinning face");
      }
    });

    it("should filter by category - smileys", async () => {
      const result = await executeTool(emojiReference, {
        category: "smileys",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("grinning face");
        expect(output).not.toContain("dog face");
        expect(output).not.toContain("pizza");
      }
    });

    it("should filter by category - animals", async () => {
      const result = await executeTool(emojiReference, {
        category: "animals",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("dog face");
        expect(output).toContain("cat face");
        expect(output).not.toContain("pizza");
      }
    });

    it("should filter by category - food", async () => {
      const result = await executeTool(emojiReference, { category: "food" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("pizza");
        expect(output).toContain("hamburger");
      }
    });

    it("should combine category and text filter", async () => {
      const result = await executeTool(emojiReference, {
        category: "smileys",
        filter: "winking",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("winking face");
      }
    });

    it("should return no matching message for no results", async () => {
      const result = await executeTool(emojiReference, {
        filter: "xyznonexistent",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toBe("No matching emoji found.");
      }
    });
  });
});
