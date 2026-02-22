import { describe, it, expect } from "vitest";
import { readmeGenerator } from "../../../src/tools/markdown/readme-generator";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("readmeGenerator", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(readmeGenerator.meta.id).toBe("markdown/readme-generator");
      expect(readmeGenerator.meta.name).toBe("README Generator");
      expect(readmeGenerator.meta.category).toBe("markdown");
      expect(readmeGenerator.meta.tier).toBe(ToolTier.CLIENT);
      expect(readmeGenerator.meta.keywords).toContain("readme");
      expect(readmeGenerator.meta.keywords).toContain("documentation");
    });
  });

  describe("execute", () => {
    it("should generate basic README", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Project",
        description: "A great project",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# My Project"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "A great project"
        );
      }
    });

    it("should include features section when provided", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Project",
        description: "A great project",
        features: ["Feature 1", "Feature 2", "Feature 3"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Features"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature 1"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature 2"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "- Feature 3"
        );
      }
    });

    it("should include installation section by default", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Project",
        description: "A great project",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Installation"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```bash"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "npm install my-project"
        );
      }
    });

    it("should exclude installation when disabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { installation: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Installation"
        );
      }
    });

    it("should include usage section by default", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Project",
        description: "A great project",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Usage"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "```javascript"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "import"
        );
      }
    });

    it("should exclude usage when disabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { usage: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Usage"
        );
      }
    });

    it("should include API section when enabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { api: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## API"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "### Methods"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Parameters:**"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "**Returns:**"
        );
      }
    });

    it("should exclude API section by default", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## API"
        );
      }
    });

    it("should include contributing section by default", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## Contributing"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Fork the repository"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Pull Request"
        );
      }
    });

    it("should exclude contributing when disabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { contributing: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Contributing"
        );
      }
    });

    it("should include license section by default", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "## License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "MIT License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "LICENSE"
        );
      }
    });

    it("should exclude license when disabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { license: false }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## License"
        );
      }
    });

    it("should generate kebab-case package name", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Awesome Project",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "npm install my-awesome-project"
        );
      }
    });

    it("should generate camelCase import name", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My Awesome Project",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "myAwesomeProject"
        );
      }
    });

    it("should fail with empty project name", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "",
        description: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("should fail with empty description", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "",
      });

      expect(result.success).toBe(false);
    });

    it("should handle special characters in project name", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "My-Project.js",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# My-Project.js"
        );
      }
    });

    it("should include parameter table in API section", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Test", description: "Test" },
        { api: true }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "| Name | Type | Description |"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "|------|------|-------------|"
        );
      }
    });

    it("should include git workflow in contributing", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "git checkout -b"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "git commit"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "git push"
        );
      }
    });

    it("should generate minimal README with all sections disabled", async () => {
      const result = await executeTool(
        readmeGenerator,
        { projectName: "Minimal", description: "Minimal project" },
        {
          installation: false,
          usage: false,
          api: false,
          contributing: false,
          license: false,
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Minimal"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Minimal project"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Installation"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Usage"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Contributing"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## License"
        );
      }
    });

    it("should not include features section when empty", async () => {
      const result = await executeTool(readmeGenerator, {
        projectName: "Test",
        description: "Test",
        features: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "## Features"
        );
      }
    });
  });
});
