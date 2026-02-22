import { describe, it, expect } from "vitest";
import { markdownLinter } from "../../../src/tools/markdown/linter";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface LinterData {
  valid: boolean;
  issues: Array<{
    rule: string;
    severity: string;
    line: number;
    message: string;
  }>;
}

describe("markdownLinter", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(markdownLinter.meta.id).toBe("markdown/linter");
      expect(markdownLinter.meta.name).toBe("Markdown Linter");
      expect(markdownLinter.meta.category).toBe("markdown");
      expect(markdownLinter.meta.tier).toBe(ToolTier.CLIENT);
      expect(markdownLinter.meta.keywords).toContain("lint");
      expect(markdownLinter.meta.keywords).toContain("style");
    });
  });

  describe("execute", () => {
    it("should pass valid markdown", async () => {
      const result = await executeTool(markdownLinter, {
        input: "# Title\n\nSome content.\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(true);
        expect(data.issues).toHaveLength(0);
      }
    });

    it("should detect trailing whitespace", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Line with trailing space   \nAnother line\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "no-trailing-spaces",
            severity: "warning",
            line: 1,
          })
        );
      }
    });

    it("should detect multiple consecutive blank lines", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Line 1\n\n\n\nLine 2\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues.some((i) => i.rule === "no-multiple-blanks")).toBe(
          true
        );
      }
    });

    it("should detect missing space after heading hash", async () => {
      const result = await executeTool(markdownLinter, {
        input: "#NoSpace\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(false);
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "no-missing-space-header",
            severity: "error",
            line: 1,
          })
        );
      }
    });

    it("should detect very long lines", async () => {
      const longLine = "x".repeat(150);
      const result = await executeTool(markdownLinter, {
        input: `${longLine}\n`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "line-length",
            severity: "warning",
          })
        );
      }
    });

    it("should not flag long lines in tables", async () => {
      const longTable = "| " + "x".repeat(130) + " |";
      const result = await executeTool(markdownLinter, {
        input: `${longTable}\n`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(
          data.issues.filter((i) => i.rule === "line-length")
        ).toHaveLength(0);
      }
    });

    it("should not flag long lines with links", async () => {
      const longLink = "[text](" + "x".repeat(130) + ")";
      const result = await executeTool(markdownLinter, {
        input: `${longLink}\n`,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(
          data.issues.filter((i) => i.rule === "line-length")
        ).toHaveLength(0);
      }
    });

    it("should detect bare URLs", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Check https://example.com for more\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "no-bare-urls",
            severity: "warning",
          })
        );
      }
    });

    it("should detect tabs", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Line with\ttab\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "no-tabs",
            severity: "warning",
          })
        );
      }
    });

    it("should detect missing final newline", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Content without newline",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "final-newline",
            severity: "warning",
          })
        );
      }
    });

    it("should report valid=true if no errors (only warnings)", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Valid content with trailing space   \n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        // Should have warning but still be valid (no errors)
        expect(data.valid).toBe(true);
        expect(data.issues.length).toBeGreaterThan(0);
      }
    });

    it("should report valid=false if errors exist", async () => {
      const result = await executeTool(markdownLinter, {
        input: "#MissingSpace\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(false);
        expect(data.issues.some((i) => i.severity === "error")).toBe(true);
      }
    });

    it("should track correct line numbers", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Line 1\nLine 2   \nLine 3\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        const trailingSpaceIssue = data.issues.find(
          (i) => i.rule === "no-trailing-spaces"
        );
        expect(trailingSpaceIssue?.line).toBe(2);
      }
    });

    it("should handle empty input", async () => {
      const result = await executeTool(markdownLinter, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(true);
        expect(data.issues).toHaveLength(0);
      }
    });

    it("should handle complex document with multiple issues", async () => {
      const markdown = `#Missing space
Line with trailing
Normal line


Multiple blanks above
Check https://example.com
Line with	tab`;

      const result = await executeTool(markdownLinter, { input: markdown });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(false);
        expect(data.issues.length).toBeGreaterThan(2);

        const rules = data.issues.map((i) => i.rule);
        expect(rules).toContain("no-missing-space-header");
        expect(rules).toContain("no-bare-urls");
        expect(rules).toContain("no-tabs");
        expect(rules).toContain("final-newline");
      }
    });

    it("should not flag URLs in markdown links", async () => {
      const result = await executeTool(markdownLinter, {
        input: "Check [our site](https://example.com) for more\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(
          data.issues.filter((i) => i.rule === "no-bare-urls")
        ).toHaveLength(0);
      }
    });

    it("should handle headings at different levels correctly", async () => {
      const result = await executeTool(markdownLinter, {
        input: "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.valid).toBe(true);
      }
    });

    it("should detect issue with ## style heading without space", async () => {
      const result = await executeTool(markdownLinter, {
        input: "##NoSpace\n",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as LinterData;
        expect(data.issues).toContainEqual(
          expect.objectContaining({
            rule: "no-missing-space-header",
          })
        );
      }
    });
  });
});
