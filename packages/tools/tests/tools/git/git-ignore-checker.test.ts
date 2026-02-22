import { describe, it, expect } from "vitest";
import { gitIgnoreChecker } from "../../../src/tools/git/git-ignore-checker";
import { executeTool } from "../../../src/core/executor";

describe("gitIgnoreChecker", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitIgnoreChecker.meta.id).toBe("git/git-ignore-checker");
      expect(gitIgnoreChecker.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should detect ignored file", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "node_modules/\n*.log" },
        { filePath: "node_modules/package/index.js" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("IGNORED");
        expect(output).toContain("node_modules/");
      }
    });

    it("should detect non-ignored file", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "node_modules/\n*.log" },
        { filePath: "src/index.ts" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("NOT IGNORED");
      }
    });

    it("should detect log files as ignored", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "*.log" },
        { filePath: "debug.log" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("IGNORED");
      }
    });

    it("should show matching patterns", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "dist/\n*.log\nnode_modules/" },
        { filePath: "dist/bundle.js" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("Matching patterns:");
        expect(output).toContain("ignores");
      }
    });

    it("should show no matching patterns when none match", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "*.log" },
        { filePath: "src/app.ts" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("No matching patterns found.");
      }
    });

    it("should skip comment lines", async () => {
      const result = await executeTool(
        gitIgnoreChecker,
        { input: "# This is a comment\n*.log" },
        { filePath: "error.log" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("IGNORED");
      }
    });

    it("should use default filePath", async () => {
      const result = await executeTool(gitIgnoreChecker, {
        input: "src/\n*.ts",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("src/index.ts");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(gitIgnoreChecker, { input: "" });
      expect(result.success).toBe(false);
    });
  });
});
