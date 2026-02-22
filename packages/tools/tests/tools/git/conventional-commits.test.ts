import { describe, it, expect } from "vitest";
import { conventionalCommits } from "../../../src/tools/git/conventional-commits";
import { executeTool } from "../../../src/core/executor";

describe("conventionalCommits", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(conventionalCommits.meta.id).toBe("git/conventional-commits");
      expect(conventionalCommits.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should generate default feat commit", async () => {
      const result = await executeTool(conventionalCommits, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feat:");
        expect(output).toContain("add new feature");
      }
    });

    it("should generate commit with scope", async () => {
      const result = await executeTool(conventionalCommits, {
        type: "fix",
        scope: "auth",
        description: "fix login bug",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("fix(auth):");
        expect(output).toContain("fix login bug");
      }
    });

    it("should generate breaking change commit", async () => {
      const result = await executeTool(conventionalCommits, {
        type: "feat",
        description: "new API",
        breaking: true,
        breakingDescription: "removed old endpoints",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feat!:");
        expect(output).toContain("BREAKING CHANGE: removed old endpoints");
      }
    });

    it("should include body", async () => {
      const result = await executeTool(conventionalCommits, {
        type: "docs",
        description: "update readme",
        body: "Added installation instructions and examples.",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("docs:");
        expect(output).toContain("Added installation instructions and examples.");
      }
    });

    it("should include issue references", async () => {
      const result = await executeTool(conventionalCommits, {
        type: "fix",
        description: "resolve crash",
        issues: "#123, #456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Refs: #123, #456");
      }
    });

    it("should include co-authors", async () => {
      const result = await executeTool(conventionalCommits, {
        type: "feat",
        description: "add feature",
        coAuthors: "John <john@example.com>",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Co-authored-by: John <john@example.com>");
      }
    });

    it("should handle all commit types", async () => {
      for (const type of ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"] as const) {
        const result = await executeTool(conventionalCommits, {
          type,
          description: "test commit",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          const output = (result.data as Record<string, unknown>).output as string;
          expect(output).toContain(`${type}:`);
        }
      }
    });
  });
});
