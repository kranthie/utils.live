import { describe, it, expect } from "vitest";
import { gitCommandBuilder } from "../../../src/tools/git/git-command-builder";
import { executeTool } from "../../../src/core/executor";

describe("gitCommandBuilder", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitCommandBuilder.meta.id).toBe("git/git-command-builder");
      expect(gitCommandBuilder.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should generate commit command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "commit",
        message: "initial commit",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git commit");
        expect(output).toContain('-m "initial commit"');
      }
    });

    it("should generate commit with files staging", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "commit",
        message: "add feature",
        files: "src/index.ts",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git add src/index.ts && git commit");
      }
    });

    it("should generate clone command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "clone",
        repository: "https://github.com/user/repo.git",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git clone https://github.com/user/repo.git");
      }
    });

    it("should generate clone with branch", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "clone",
        repository: "https://github.com/user/repo.git",
        branch: "develop",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("-b develop");
      }
    });

    it("should generate push command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "push",
        branch: "main",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git push origin main");
      }
    });

    it("should generate pull command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "pull",
        remote: "upstream",
        branch: "develop",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git pull upstream develop");
      }
    });

    it("should generate branch command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "branch",
        branch: "feature/new",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git branch feature/new");
      }
    });

    it("should generate merge command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "merge",
        branch: "feature/new",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git merge feature/new");
      }
    });

    it("should generate stash command with message", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "stash",
        message: "work in progress",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain('git stash push -m "work in progress"');
      }
    });

    it("should generate log command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "log",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git log --oneline --graph");
      }
    });

    it("should generate diff command with files", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "diff",
        branch: "main",
        files: "src/app.ts",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git diff main -- src/app.ts");
      }
    });

    it("should generate tag command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "tag",
        branch: "v1.0.0",
        message: "Version 1.0.0",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git tag v1.0.0");
        expect(output).toContain('-m "Version 1.0.0"');
      }
    });

    it("should generate cherry-pick command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "cherry-pick",
        branch: "abc123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git cherry-pick abc123");
      }
    });

    it("should generate bisect command", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "bisect",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("git bisect start");
      }
    });

    it("should append additional flags", async () => {
      const result = await executeTool(gitCommandBuilder, {
        action: "push",
        flags: "--force-with-lease",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("--force-with-lease");
      }
    });
  });
});
