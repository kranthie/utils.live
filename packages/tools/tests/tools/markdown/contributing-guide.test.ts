import { describe, it, expect } from "vitest";
import { contributingGuide } from "../../../src/tools/markdown/contributing-guide";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("contributingGuide", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(contributingGuide.meta.id).toBe("markdown/contributing-guide");
      expect(contributingGuide.meta.name).toBe("Contributing Guide");
      expect(contributingGuide.meta.category).toBe("markdown");
      expect(contributingGuide.meta.tier).toBe(ToolTier.CLIENT);
      expect(contributingGuide.meta.keywords).toContain("contributing");
      expect(contributingGuide.meta.keywords).toContain("guide");
    });
  });

  describe("execute", () => {
    it("should generate complete contributing guide", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "My Project",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Contributing to My Project"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Table of Contents"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Reporting Bugs"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Suggesting Features"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Pull Requests"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Code Style"
        );
      }
    });

    it("should include table of contents with all default sections", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [Reporting Bugs]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [Suggesting Features]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [Pull Requests]"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [Code Style]"
        );
      }
    });

    it("should exclude bugs section when disabled", async () => {
      const result = await executeTool(
        contributingGuide,
        { projectName: "Test" },
        { bugs: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Reporting Bugs"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "- [Reporting Bugs]"
        );
      }
    });

    it("should exclude features section when disabled", async () => {
      const result = await executeTool(
        contributingGuide,
        { projectName: "Test" },
        { features: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Suggesting Features"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "- [Suggesting Features]"
        );
      }
    });

    it("should exclude pull requests section when disabled", async () => {
      const result = await executeTool(
        contributingGuide,
        { projectName: "Test" },
        { pullRequests: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Pull Requests"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "- [Pull Requests]"
        );
      }
    });

    it("should exclude code style section when disabled", async () => {
      const result = await executeTool(
        contributingGuide,
        { projectName: "Test" },
        { codeStyle: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Code Style"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "- [Code Style]"
        );
      }
    });

    it("should include bug reporting guidelines", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Clear title**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Steps to reproduce**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Expected behavior**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Environment details**"
        );
      }
    });

    it("should include PR workflow steps", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Fork the repository"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Clone your fork"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Create a branch"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "git checkout"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "npm test"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "git commit"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "git push"
        );
      }
    });

    it("should include code style guidelines", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "consistent indentation"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "npm run lint"
        );
      }
    });

    it("should include questions section", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Questions?"
        );
      }
    });

    it("should fail with empty project name", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "",
      });

      expect(result.success).toBe(false);
    });

    it("should generate minimal guide with all sections disabled", async () => {
      const result = await executeTool(
        contributingGuide,
        { projectName: "Minimal" },
        { bugs: false, features: false, pullRequests: false, codeStyle: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Contributing to Minimal"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Questions?"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Reporting Bugs"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Suggesting Features"
        );
      }
    });

    it("should use project name in intro text", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Awesome Library",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "interest in contributing to Awesome Library"
        );
      }
    });

    it("should include PR guidelines", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "### PR Guidelines"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "One feature/fix per PR"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Write tests"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Update documentation"
        );
      }
    });

    it("should generate proper markdown structure", async () => {
      const result = await executeTool(contributingGuide, {
        projectName: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should start with h1
        expect((result.data as Record<string, unknown>).output).toMatch(/^# /);
        // Should have code blocks
        expect((result.data as Record<string, unknown>).output).toContain(
          "```bash"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```"
        );
        // Should have list items
        expect((result.data as Record<string, unknown>).output).toContain("- ");
        // Should have numbered steps
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. "
        );
      }
    });
  });
});
