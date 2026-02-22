import { describe, it, expect } from "vitest";
import { semverBumper } from "../../../src/tools/code/semver-bumper";
import { executeTool } from "../../../src/core/executor";

describe("semverBumper", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(semverBumper.meta.id).toBe("code/semver-bumper");
      expect(semverBumper.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should bump patch version by default", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.2.4");
      }
    });

    it("should bump major version", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" }, { bump: "major" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v2.0.0");
      }
    });

    it("should bump minor version", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" }, { bump: "minor" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.3.0");
      }
    });

    it("should bump premajor", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" }, { bump: "premajor" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v2.0.0-beta.0");
      }
    });

    it("should bump preminor", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" }, { bump: "preminor" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.3.0-beta.0");
      }
    });

    it("should bump prepatch", async () => {
      const result = await executeTool(semverBumper, { input: "1.2.3" }, { bump: "prepatch" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.2.4-beta.0");
      }
    });

    it("should bump prerelease from existing prerelease", async () => {
      const result = await executeTool(
        semverBumper,
        { input: "1.2.3-beta.0" },
        { bump: "prerelease" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.2.3-beta.1");
      }
    });

    it("should bump prerelease from stable version", async () => {
      const result = await executeTool(
        semverBumper,
        { input: "1.2.3" },
        { bump: "prerelease" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.2.4-beta.0");
      }
    });

    it("should strip v prefix from input", async () => {
      const result = await executeTool(semverBumper, { input: "v1.2.3" });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("v1.2.4");
      }
    });

    it("should release prerelease with patch bump", async () => {
      const result = await executeTool(
        semverBumper,
        { input: "1.2.3-beta.0" },
        { bump: "patch" }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("New:     1.2.3");
        expect(output).toContain("v1.2.3");
      }
    });

    it("should reject empty input", async () => {
      const result = await executeTool(semverBumper, { input: "" });
      expect(result.success).toBe(false);
    });

    it("should reject invalid semver", async () => {
      const result = await executeTool(semverBumper, { input: "not-a-version" });
      expect(result.success).toBe(false);
    });
  });
});
