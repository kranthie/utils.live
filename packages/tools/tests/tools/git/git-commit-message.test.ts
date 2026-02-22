import { describe, it, expect } from "vitest";
import { gitCommitMessage } from "../../../src/tools/git/git-commit-message";
import { executeTool } from "../../../src/core/executor";

describe("gitCommitMessage", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitCommitMessage.meta.id).toBe("git/git-commit-message");
      expect(gitCommitMessage.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should generate default feat commit message", async () => {
      const result = await executeTool(gitCommitMessage, {
        input: "Add user authentication",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feat: add user authentication");
      }
    });

    it("should generate fix commit with scope", async () => {
      const result = await executeTool(
        gitCommitMessage,
        { input: "Fix login crash" },
        { type: "fix", scope: "auth" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("fix(auth): fix login crash");
      }
    });

    it("should generate breaking change commit", async () => {
      const result = await executeTool(
        gitCommitMessage,
        { input: "Remove deprecated API" },
        { type: "feat", breaking: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feat!:");
        expect(output).toContain("BREAKING CHANGE:");
      }
    });

    it("should include body", async () => {
      const result = await executeTool(
        gitCommitMessage,
        { input: "Add feature" },
        { body: "Detailed explanation of the change." }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Detailed explanation of the change.");
      }
    });

    it("should include footer", async () => {
      const result = await executeTool(
        gitCommitMessage,
        { input: "Fix bug" },
        { type: "fix", footer: "Fixes #123" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Fixes #123");
      }
    });

    it("should lowercase first character of description", async () => {
      const result = await executeTool(gitCommitMessage, {
        input: "Update readme",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("feat: update readme");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(gitCommitMessage, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject whitespace-only input", async () => {
      const result = await executeTool(gitCommitMessage, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
