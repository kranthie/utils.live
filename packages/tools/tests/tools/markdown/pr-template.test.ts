import { describe, it, expect } from "vitest";
import { prTemplate } from "../../../src/tools/markdown/pr-template";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("prTemplate", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(prTemplate.meta.id).toBe("markdown/pr-template");
      expect(prTemplate.meta.name).toBe("PR Template Generator");
      expect(prTemplate.meta.category).toBe("markdown");
      expect(prTemplate.meta.tier).toBe(ToolTier.CLIENT);
      expect(prTemplate.meta.keywords).toContain("pr");
      expect(prTemplate.meta.keywords).toContain("pull-request");
    });
  });

  describe("execute", () => {
    it("should generate standard PR template", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Description"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Related Issue"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Type of Change"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## How Has This Been Tested?"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Checklist"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "PULL_REQUEST_TEMPLATE.md"
        );
      }
    });

    it("should generate minimal PR template", async () => {
      const result = await executeTool(prTemplate, {
        style: "minimal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Summary"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Changes"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Testing"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Checklist"
        );
      }
    });

    it("should generate detailed PR template", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Pull Request"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Description"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Motivation and Context"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Related Issues"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Type of Change"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Implementation Details"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Testing Strategy"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Checklist"
        );
      }
    });

    it("should use custom project name", async () => {
      const result = await executeTool(
        prTemplate,
        { style: "standard" },
        { projectName: "My Project" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "My Project"
        );
      }
    });

    it("should include checklist by default", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Checklist"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- [ ]"
        );
      }
    });

    it("should exclude checklist when disabled", async () => {
      const result = await executeTool(
        prTemplate,
        { style: "standard" },
        { requireChecklist: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Checklist"
        );
      }
    });

    it("should include change type options in standard", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bug fix"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "New feature"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Breaking change"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Documentation update"
        );
      }
    });

    it("should include emoji change types in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Bug fix"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "New feature"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Refactoring"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Tests"
        );
      }
    });

    it("should include test cases section in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "#### Test Cases"
        );
        expect((result.data as Record<string, unknown>).output).toContain("1.");
        expect((result.data as Record<string, unknown>).output).toContain("2.");
        expect((result.data as Record<string, unknown>).output).toContain("3.");
      }
    });

    it("should include screenshots section", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Screenshots"
        );
      }
    });

    it("should include issue linking syntax", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Fixes #"
        );
      }
    });

    it("should use default project name when not provided", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Project"
        );
      }
    });

    it("should always return correct filename", async () => {
      const styles = ["standard", "minimal", "detailed"] as const;

      for (const style of styles) {
        const result = await executeTool(prTemplate, { style });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).filename).toBe(
            "PULL_REQUEST_TEMPLATE.md"
          );
        }
      }
    });

    it("should use default style when not provided", async () => {
      const result = await executeTool(prTemplate, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Description"
        );
      }
    });

    it("should include code quality checklist in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "#### Code Quality"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "coding standards"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Self-review"
        );
      }
    });

    it("should include documentation checklist in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "#### Documentation"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "README"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "API documentation"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Changelog"
        );
      }
    });

    it("should include review section in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "#### Review"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Ready for review"
        );
      }
    });

    it("should include additional notes in detailed", async () => {
      const result = await executeTool(prTemplate, {
        style: "detailed",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Additional Notes"
        );
      }
    });

    it("should have proper markdown checkbox syntax", async () => {
      const result = await executeTool(prTemplate, {
        style: "standard",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check for unchecked checkbox syntax
        expect((result.data as Record<string, unknown>).output).toMatch(
          /- \[ \]/
        );
      }
    });
  });
});
