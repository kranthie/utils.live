import { describe, it, expect } from "vitest";
import { changelogParser } from "../../../src/tools/git/changelog-parser";
import { executeTool } from "../../../src/core/executor";

interface ChangelogRelease {
  version: string;
  date: string;
  changes: Record<string, string[]>;
}

interface ChangelogOutput {
  totalReleases: number;
  latestVersion: string;
  releases: ChangelogRelease[];
}

describe("changelogParser", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(changelogParser.meta.id).toBe("git/changelog-parser");
      expect(changelogParser.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should parse a simple changelog", async () => {
      const result = await executeTool(changelogParser, {
        input:
          "## [1.0.0] - 2024-01-01\n### Added\n- Initial release\n- Feature A",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as ChangelogOutput;
        expect(parsed.totalReleases).toBe(1);
        expect(parsed.latestVersion).toBe("1.0.0");
        expect(parsed.releases[0].date).toBe("2024-01-01");
        expect(parsed.releases[0].changes.Added).toContain("Initial release");
        expect(parsed.releases[0].changes.Added).toContain("Feature A");
      }
    });

    it("should parse multiple versions", async () => {
      const result = await executeTool(changelogParser, {
        input:
          "## [2.0.0] - 2024-06-01\n### Changed\n- Breaking change\n\n## [1.0.0] - 2024-01-01\n### Added\n- Initial release",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as ChangelogOutput;
        expect(parsed.totalReleases).toBe(2);
        expect(parsed.latestVersion).toBe("2.0.0");
      }
    });

    it("should parse version without brackets", async () => {
      const result = await executeTool(changelogParser, {
        input: "## [1.2.3] - 2024-03-15\n### Fixed\n- Bug fix",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as ChangelogOutput;
        expect(parsed.latestVersion).toBe("1.2.3");
        expect(parsed.releases[0].date).toBe("2024-03-15");
        expect(parsed.releases[0].changes.Fixed).toContain("Bug fix");
      }
    });

    it("should parse multiple sections in a release", async () => {
      const result = await executeTool(changelogParser, {
        input:
          "## [1.0.0] - 2024-01-01\n### Added\n- New feature\n### Fixed\n- Bug fix\n### Removed\n- Old feature",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as ChangelogOutput;
        expect(parsed.releases[0].changes.Added).toContain("New feature");
        expect(parsed.releases[0].changes.Fixed).toContain("Bug fix");
        expect(parsed.releases[0].changes.Removed).toContain("Old feature");
      }
    });

    it("should handle * bullet points", async () => {
      const result = await executeTool(changelogParser, {
        input: "## [1.0.0] - 2024-01-01\n### Added\n* Star bullet item",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        const parsed = JSON.parse(output) as ChangelogOutput;
        expect(parsed.releases[0].changes.Added).toContain("Star bullet item");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(changelogParser, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject input with no version entries", async () => {
      const result = await executeTool(changelogParser, {
        input: "# Changelog\n\nSome random text without version headers.",
      });
      expect(result.success).toBe(false);
    });
  });
});
