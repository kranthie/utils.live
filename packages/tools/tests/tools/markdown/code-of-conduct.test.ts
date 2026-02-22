import { describe, it, expect } from "vitest";
import { codeOfConduct } from "../../../src/tools/markdown/code-of-conduct";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("codeOfConduct", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(codeOfConduct.meta.id).toBe("markdown/code-of-conduct");
      expect(codeOfConduct.meta.name).toBe("Code of Conduct Generator");
      expect(codeOfConduct.meta.category).toBe("markdown");
      expect(codeOfConduct.meta.tier).toBe(ToolTier.CLIENT);
      expect(codeOfConduct.meta.keywords).toContain("code-of-conduct");
    });
  });

  describe("execute", () => {
    it("should generate contributor covenant by default", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "contributor-covenant",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Contributor Covenant Code of Conduct"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Our Pledge"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Our Standards"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Enforcement"
        );
        expect((result.data as Record<string, unknown>).filename).toBe(
          "CODE_OF_CONDUCT.md"
        );
      }
    });

    it("should generate citizen code of conduct", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "citizen-code",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Citizen Code of Conduct"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## 1. Purpose"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## 2. Expected Behavior"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## 3. Unacceptable Behavior"
        );
      }
    });

    it("should generate minimal code of conduct", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "minimal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Code of Conduct"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Our Pledge"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Our Standards"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Enforcement"
        );
      }
    });

    it("should use custom project name", async () => {
      const result = await executeTool(
        codeOfConduct,
        { type: "contributor-covenant" },
        { projectName: "My Awesome Project" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "My Awesome Project"
        );
      }
    });

    it("should use custom contact email", async () => {
      const result = await executeTool(
        codeOfConduct,
        { type: "contributor-covenant" },
        { contactEmail: "contact@myproject.org" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "contact@myproject.org"
        );
      }
    });

    it("should use default project name when not provided", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "minimal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Project"
        );
      }
    });

    it("should use default contact email when not provided", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "minimal",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "conduct@example.com"
        );
      }
    });

    it("should always return CODE_OF_CONDUCT.md as filename", async () => {
      const types = [
        "contributor-covenant",
        "citizen-code",
        "minimal",
      ] as const;

      for (const type of types) {
        const result = await executeTool(codeOfConduct, { type });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).filename).toBe(
            "CODE_OF_CONDUCT.md"
          );
        }
      }
    });

    it("should include attribution in contributor covenant", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "contributor-covenant",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Contributor Covenant"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "contributor-covenant.org"
        );
      }
    });

    it("should include scope section", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "contributor-covenant",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Scope"
        );
      }
    });

    it("should include enforcement responsibilities", async () => {
      const result = await executeTool(codeOfConduct, {
        type: "contributor-covenant",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Enforcement Responsibilities"
        );
      }
    });

    it("should generate valid markdown", async () => {
      const result = await executeTool(
        codeOfConduct,
        { type: "contributor-covenant" },
        { projectName: "Test", contactEmail: "test@test.com" }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        // Should start with h1 heading
        expect((result.data as Record<string, unknown>).output).toMatch(/^# /);
        // Should have multiple h2 sections
        expect((result.data as Record<string, unknown>).output).toContain(
          "## "
        );
        // Should have list items
        expect((result.data as Record<string, unknown>).output).toContain("* ");
      }
    });

    it("should handle all types with custom options", async () => {
      const types = [
        "contributor-covenant",
        "citizen-code",
        "minimal",
      ] as const;
      const options = {
        projectName: "Custom Project",
        contactEmail: "custom@email.com",
      };

      for (const type of types) {
        const result = await executeTool(codeOfConduct, { type }, options);

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toContain(
            "Custom Project"
          );
          expect((result.data as Record<string, unknown>).output).toContain(
            "custom@email.com"
          );
        }
      }
    });
  });
});
