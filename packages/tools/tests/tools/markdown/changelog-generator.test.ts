import { describe, it, expect } from "vitest";
import { changelogGenerator } from "../../../src/tools/markdown/changelog-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("changelogGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(changelogGenerator.meta.id).toBe("markdown/changelog-generator");
      expect(changelogGenerator.meta.name).toBe("Changelog Generator");
      expect(changelogGenerator.meta.category).toBe("markdown");
      expect(changelogGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(changelogGenerator.meta.keywords).toContain("changelog");
      expect(changelogGenerator.meta.keywords).toContain("version");
    });
  });

  describe("execute", () => {
    it("should generate basic changelog entry", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "2024-01-15",
        changes: {
          added: ["New feature A"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## [1.0.0] - 2024-01-15"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Added"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- New feature A"
        );
      }
    });

    it("should generate changelog with all change types", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "2.0.0",
        date: "2024-02-20",
        changes: {
          added: ["Feature 1", "Feature 2"],
          changed: ["Changed behavior"],
          deprecated: ["Old API"],
          removed: ["Legacy function"],
          fixed: ["Bug fix 1"],
          security: ["Security patch"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Added"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Changed"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Changed behavior"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Deprecated"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Old API"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Removed"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Legacy function"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Fixed"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Bug fix 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Security"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Security patch"
        );
      }
    });

    it("should generate version comparison link when options provided", async () => {
      const result = await executeTool(
        changelogGenerator,
        {
          version: "1.1.0",
          date: "2024-03-01",
          changes: {
            fixed: ["Critical bug"],
          },
        },
        {
          linkBase: "https://github.com/owner/repo",
          previousVersion: "1.0.0",
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## [1.1.0](https://github.com/owner/repo/compare/v1.0.0...v1.1.0)"
        );
      }
    });

    it("should handle empty changes object", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "0.1.0",
        date: "2024-01-01",
        changes: {},
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## [0.1.0] - 2024-01-01"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "### Added"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "### Changed"
        );
      }
    });

    it("should handle empty arrays in changes", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "2024-01-15",
        changes: {
          added: [],
          fixed: ["One fix"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "### Added"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Fixed"
        );
      }
    });

    it("should handle multiple items in each category", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.2.0",
        date: "2024-04-10",
        changes: {
          added: ["Item 1", "Item 2", "Item 3"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Item 3"
        );
      }
    });

    it("should preserve order of change categories", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "2024-01-01",
        changes: {
          security: ["Security fix"],
          added: ["New feature"],
          removed: ["Old feature"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { output: string };
        const output = data.output;
        const addedIndex = output.indexOf("### Added");
        const removedIndex = output.indexOf("### Removed");
        const securityIndex = output.indexOf("### Security");
        // Standard order: Added, Changed, Deprecated, Removed, Fixed, Security
        expect(addedIndex).toBeLessThan(removedIndex);
        expect(removedIndex).toBeLessThan(securityIndex);
      }
    });

    it("should handle special characters in change descriptions", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "2024-01-01",
        changes: {
          added: ["Support for `code` blocks", "Feature with **bold** text"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Support for `code` blocks"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature with **bold** text"
        );
      }
    });

    it("should fail with empty version", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "",
        date: "2024-01-01",
        changes: {},
      });

      expect(result.success).toBe(false);
    });

    it("should fail with empty date", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "",
        changes: {},
      });

      expect(result.success).toBe(false);
    });

    it("should generate proper markdown formatting", async () => {
      const result = await executeTool(changelogGenerator, {
        version: "1.0.0",
        date: "2024-01-01",
        changes: {
          added: ["Feature"],
        },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Check proper blank lines between sections
        expect((result.data as Record<string, unknown>).output).toMatch(
          /## \[1\.0\.0\].*\n\n### Added/
        );
        expect((result.data as Record<string, unknown>).output).toMatch(
          /### Added\n\n- Feature/
        );
      }
    });
  });
});
