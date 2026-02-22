import { describe, it, expect } from "vitest";
import { gitBranchNamer } from "../../../src/tools/git/git-branch-namer";
import { executeTool } from "../../../src/core/executor";

describe("gitBranchNamer", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitBranchNamer.meta.id).toBe("git/git-branch-namer");
      expect(gitBranchNamer.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should generate gitflow branch name", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "feature",
        description: "add user authentication",
        convention: "gitflow",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feature/add-user-authentication");
      }
    });

    it("should generate gitflow branch with issue number", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "bugfix",
        description: "fix login crash",
        issueNumber: "JIRA-123",
        convention: "gitflow",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("bugfix/JIRA-123-fix-login-crash");
        expect(output).toContain("bugfix/JIRA-123");
      }
    });

    it("should generate github convention branch", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "feature",
        description: "add dark mode",
        convention: "github",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("add-dark-mode");
        expect(output).toContain("feature/add-dark-mode");
      }
    });

    it("should generate simple convention branch", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "feature",
        description: "new feature",
        convention: "simple",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("new-feature");
        expect(output).toContain("feature-new-feature");
      }
    });

    it("should generate jira convention branch with issue", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "feature",
        description: "implement search",
        issueNumber: "PROJ-42",
        convention: "jira",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feature/PROJ-42-implement-search");
        expect(output).toContain("PROJ-42/implement-search");
      }
    });

    it("should slugify special characters", async () => {
      const result = await executeTool(gitBranchNamer, {
        type: "feature",
        description: "Add User's Authentication & Login!!!",
        convention: "simple",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("add-user-s-authentication-login");
      }
    });

    it("should use default values", async () => {
      const result = await executeTool(gitBranchNamer, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Branch Name Suggestions");
        expect(output).toContain("feature/");
      }
    });
  });
});
