import { describe, it, expect } from "vitest";
import { badgeGenerator } from "../../../src/tools/markdown/badge-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("badgeGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(badgeGenerator.meta.id).toBe("markdown/badge-generator");
      expect(badgeGenerator.meta.name).toBe("Badge Generator");
      expect(badgeGenerator.meta.category).toBe("markdown");
      expect(badgeGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(badgeGenerator.meta.keywords).toContain("badge");
      expect(badgeGenerator.meta.keywords).toContain("shields");
    });
  });

  describe("execute", () => {
    it("should generate npm badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "npm" },
        { packageName: "express" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "img.shields.io/npm/v/express"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "[![npm]"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "npmjs.com/package/express"
        );
      }
    });

    it("should generate license badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "license" },
        { owner: "facebook", repo: "react" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "github/license/facebook/react"
        );
      }
    });

    it("should generate build badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "build" },
        { owner: "nodejs", repo: "node" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "actions/workflow/status"
        );
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "nodejs/node"
        );
      }
    });

    it("should generate coverage badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "coverage" },
        { owner: "jest", repo: "jest" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "codecov"
        );
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "jest/jest"
        );
      }
    });

    it("should generate version badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "version" },
        { owner: "vuejs", repo: "vue" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "github/v/release/vuejs/vue"
        );
      }
    });

    it("should generate npm downloads badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "downloads" },
        { packageName: "lodash" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "npm/dm/lodash"
        );
      }
    });

    it("should generate github downloads badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "downloads" },
        { owner: "microsoft", repo: "vscode" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "github/downloads/microsoft/vscode"
        );
      }
    });

    it("should generate stars badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "stars" },
        { owner: "torvalds", repo: "linux" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "github/stars/torvalds/linux"
        );
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "github.com/torvalds/linux"
        );
      }
    });

    it("should generate custom badge", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "custom" },
        { label: "build", message: "passing", color: "green" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "build-passing-green"
        );
      }
    });

    it("should support different badge styles", async () => {
      const styles = [
        "flat",
        "flat-square",
        "plastic",
        "for-the-badge",
        "social",
      ] as const;

      for (const style of styles) {
        const result = await executeTool(
          badgeGenerator,
          { type: "npm" },
          { packageName: "test", style }
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).imageUrl).toContain(
            `style=${style}`
          );
        }
      }
    });

    it("should include custom link when provided", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "custom" },
        { label: "docs", message: "read", link: "https://docs.example.com" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).markdown).toContain(
          "https://docs.example.com"
        );
      }
    });

    it("should use default values when options not provided", async () => {
      const result = await executeTool(badgeGenerator, { type: "npm" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "package"
        );
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "style=flat"
        );
      }
    });

    it("should generate valid markdown link syntax", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "npm" },
        { packageName: "axios" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should match [![type](imageUrl)](link) format
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /^\[!\[.*\]\(.*\)\]\(.*\)$/
        );
      }
    });

    it("should generate plain image markdown when no link", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "coverage" },
        { owner: "test", repo: "test" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Coverage badges don't have auto-links
        expect((result.data as Record<string, unknown>).markdown).toMatch(
          /^!\[.*\]\(.*\)$/
        );
      }
    });

    it("should encode special characters in custom labels", async () => {
      const result = await executeTool(
        badgeGenerator,
        { type: "custom" },
        { label: "hello world", message: "test value" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "hello%20world"
        );
        expect((result.data as Record<string, unknown>).imageUrl).toContain(
          "test%20value"
        );
      }
    });
  });
});
