import { describe, it, expect } from "vitest";
import { gitignoreBuilder } from "../../../src/tools/git/gitignore-builder";
import { executeTool } from "../../../src/core/executor";

describe("gitignoreBuilder", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitignoreBuilder.meta.id).toBe("git/gitignore-builder");
      expect(gitignoreBuilder.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should generate default .gitignore with all common patterns", async () => {
      const result = await executeTool(gitignoreBuilder, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("node_modules/");
        expect(output).toContain("dist/");
        expect(output).toContain(".env");
        expect(output).toContain("*.log");
        expect(output).toContain("coverage/");
        expect(output).toContain(".idea/");
        expect(output).toContain(".DS_Store");
        expect(output).toContain(".cache/");
      }
    });

    it("should not include docker by default", async () => {
      const result = await executeTool(gitignoreBuilder, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("# Docker");
      }
    });

    it("should include docker when enabled", async () => {
      const result = await executeTool(gitignoreBuilder, { docker: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Docker");
        expect(output).toContain("docker-compose.override.yml");
      }
    });

    it("should include terraform when enabled", async () => {
      const result = await executeTool(gitignoreBuilder, { terraform: true });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Terraform");
        expect(output).toContain(".terraform/");
        expect(output).toContain("*.tfstate");
      }
    });

    it("should exclude sections when disabled", async () => {
      const result = await executeTool(gitignoreBuilder, {
        nodeModules: false,
        dist: false,
        env: false,
        logs: false,
        coverage: false,
        ide: false,
        os: false,
        cache: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("node_modules/");
        expect(output).not.toContain("dist/");
        expect(output).not.toContain(".env");
      }
    });

    it("should include custom patterns", async () => {
      const result = await executeTool(gitignoreBuilder, {
        custom: "*.secret\n.myconfig",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Custom");
        expect(output).toContain("*.secret");
        expect(output).toContain(".myconfig");
      }
    });

    it("should contain generated header", async () => {
      const result = await executeTool(gitignoreBuilder, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("# Generated .gitignore");
      }
    });
  });
});
