import { describe, it, expect } from "vitest";
import { issueTemplate } from "../../../src/tools/markdown/issue-template";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("issueTemplate", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(issueTemplate.meta.id).toBe("markdown/issue-template");
      expect(issueTemplate.meta.name).toBe("Issue Template Generator");
      expect(issueTemplate.meta.category).toBe("markdown");
      expect(issueTemplate.meta.tier).toBe(ToolTier.CLIENT);
      expect(issueTemplate.meta.keywords).toContain("issue");
      expect(issueTemplate.meta.keywords).toContain("template");
    });
  });

  describe("execute", () => {
    it("should generate bug report template", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name: Bug Report"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Bug Description"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Steps to Reproduce"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Expected Behavior"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Actual Behavior"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Environment"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels: bug"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "ISSUE_TEMPLATE/bug_report.md"
        );
      }
    });

    it("should generate feature request template", async () => {
      const result = await executeTool(issueTemplate, {
        type: "feature",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name: Feature Request"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Feature Description"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Problem Statement"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Proposed Solution"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Alternatives Considered"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels: enhancement"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "ISSUE_TEMPLATE/feature_report.md"
        );
      }
    });

    it("should generate question template", async () => {
      const result = await executeTool(issueTemplate, {
        type: "question",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name: Question"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Question"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Context"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## What I've Tried"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels: question"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "ISSUE_TEMPLATE/question_report.md"
        );
      }
    });

    it("should generate blank template", async () => {
      const result = await executeTool(issueTemplate, {
        type: "blank",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "name: Blank Issue"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "about: Create a blank issue"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "ISSUE_TEMPLATE.md"
        );
      }
    });

    it("should use custom project name", async () => {
      const result = await executeTool(
        issueTemplate,
        { type: "bug" },
        { projectName: "My Awesome Project" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Report a bug in My Awesome Project"
        );
      }
    });

    it("should include labels by default", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels: bug"
        );
      }
    });

    it("should exclude labels when disabled", async () => {
      const result = await executeTool(
        issueTemplate,
        { type: "bug" },
        { includeLabels: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels: ''"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "labels: bug"
        );
      }
    });

    it("should have proper YAML frontmatter", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /^---\n/
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "name:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "about:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "title:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "labels:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "assignees:"
        );
      }
    });

    it("should include title prefix for bug", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          'title: "[BUG] "'
        );
      }
    });

    it("should include title prefix for feature", async () => {
      const result = await executeTool(issueTemplate, {
        type: "feature",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          'title: "[FEATURE] "'
        );
      }
    });

    it("should include title prefix for question", async () => {
      const result = await executeTool(issueTemplate, {
        type: "question",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          'title: "[QUESTION] "'
        );
      }
    });

    it("should include environment section in bug report", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Environment"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- OS:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Browser:"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Version:"
        );
      }
    });

    it("should include screenshots section", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Screenshots"
        );
      }
    });

    it("should include additional context section", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Additional Context"
        );
      }
    });

    it("should handle default type as bug", async () => {
      const result = await executeTool(issueTemplate, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bug Report"
        );
      }
    });

    it("should use default project name when not provided", async () => {
      const result = await executeTool(issueTemplate, {
        type: "feature",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Project"
        );
      }
    });

    it("should generate valid markdown structure", async () => {
      const result = await executeTool(issueTemplate, {
        type: "bug",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should have h2 sections
        expect((result.data as Record<string, unknown>).output).toMatch(
          /^## /m
        );
        // Should have list items
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. "
        );
        // Should have placeholders
        expect((result.data as Record<string, unknown>).output).toContain(
          "[e.g.,"
        );
      }
    });
  });
});
