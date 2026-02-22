import { describe, it, expect } from "vitest";
import { frontmatterEditor } from "../../../src/tools/markdown/frontmatter-editor";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("frontmatterEditor", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(frontmatterEditor.meta.id).toBe("markdown/frontmatter-editor");
      expect(frontmatterEditor.meta.name).toBe("Frontmatter Editor");
      expect(frontmatterEditor.meta.category).toBe("markdown");
      expect(frontmatterEditor.meta.tier).toBe(ToolTier.CLIENT);
      expect(frontmatterEditor.meta.keywords).toContain("frontmatter");
      expect(frontmatterEditor.meta.keywords).toContain("yaml");
    });
  });

  describe("execute", () => {
    it("should parse existing frontmatter", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\ntitle: Test\nauthor: John\n---\n\nContent here",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hasFrontmatter).toBe(
          true
        );
        expect((result.data as Record<string, unknown>).frontmatter).toEqual({
          title: "Test",
          author: "John",
        });
        expect((result.data as Record<string, unknown>).content).toBe(
          "\nContent here"
        );
      }
    });

    it("should handle document without frontmatter", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "# Just Content\n\nNo frontmatter here.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hasFrontmatter).toBe(
          false
        );
        expect((result.data as Record<string, unknown>).frontmatter).toEqual(
          {}
        );
        expect((result.data as Record<string, unknown>).content).toBe(
          "# Just Content\n\nNo frontmatter here."
        );
      }
    });

    it("should add new field to frontmatter", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "---\ntitle: Test\n---\n\nContent",
        },
        { updates: { author: "Jane" } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).frontmatter).toEqual({
          title: "Test",
          author: "Jane",
        });
        expect((result.data as Record<string, unknown>).output).toContain(
          "author: Jane"
        );
      }
    });

    it("should update existing field", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "---\ntitle: Old Title\n---\n\nContent",
        },
        { updates: { title: "New Title" } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as {
          frontmatter: Record<string, unknown>;
          output: string;
        };
        expect(data.frontmatter.title).toBe("New Title");
        expect(data.output).toContain("title: New Title");
      }
    });

    it("should remove specified fields", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input:
            "---\ntitle: Test\nauthor: John\ndate: 2024-01-01\n---\n\nContent",
        },
        { remove: ["author", "date"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).frontmatter).toEqual({
          title: "Test",
        });
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "author:"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "date:"
        );
      }
    });

    it("should add frontmatter to document without one", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "# Content\n\nJust content.",
        },
        { updates: { title: "New Title" } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hasFrontmatter).toBe(
          true
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "---\ntitle: New Title\n---\n"
        );
      }
    });

    it("should handle empty frontmatter", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\n---\n\nContent",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Empty frontmatter may be treated as no frontmatter or empty object
        expect((result.data as Record<string, unknown>).content).toContain(
          "Content"
        );
      }
    });

    it("should handle complex YAML values", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\ntags:\n  - one\n  - two\ncount: 42\n---\n\nContent",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { frontmatter: Record<string, unknown> };
        expect(data.frontmatter.tags).toEqual(["one", "two"]);
        expect(data.frontmatter.count).toBe(42);
      }
    });

    it("should update with complex values", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "---\ntitle: Test\n---\n\nContent",
        },
        {
          updates: {
            tags: ["a", "b", "c"],
            metadata: { key: "value" },
          },
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { frontmatter: Record<string, unknown> };
        expect(data.frontmatter.tags).toEqual(["a", "b", "c"]);
        expect(data.frontmatter.metadata).toEqual({ key: "value" });
      }
    });

    it("should preserve content after editing", async () => {
      const content = "\n# Main Content\n\nParagraph here.\n\n```code```";
      const result = await executeTool(
        frontmatterEditor,
        {
          input: `---\ntitle: Test\n---${content}`,
        },
        { updates: { newField: "value" } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "# Main Content"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Paragraph here."
        );
      }
    });

    it("should handle both updates and removes", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "---\ntitle: Test\nold: value\n---\n\nContent",
        },
        { updates: { newField: "new" }, remove: ["old"] }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).frontmatter).toEqual({
          title: "Test",
          newField: "new",
        });
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "old:"
        );
      }
    });

    it("should handle undefined value in updates to remove field", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "---\ntitle: Test\nauthor: John\n---\n\nContent",
        },
        { updates: { author: undefined } }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { frontmatter: Record<string, unknown> };
        expect(data.frontmatter.author).toBeUndefined();
      }
    });

    it("should fail on invalid YAML frontmatter", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\n[invalid yaml\n---\n\nContent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MARKDOWN_INVALID_FRONTMATTER");
      }
    });

    it("should fail when frontmatter is not an object", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\n- just\n- an\n- array\n---\n\nContent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MARKDOWN_INVALID_FRONTMATTER");
      }
    });

    it("should handle CRLF line endings", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "---\r\ntitle: Test\r\n---\r\n\r\nContent",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as { frontmatter: Record<string, unknown> };
        expect(data.frontmatter.title).toBe("Test");
      }
    });

    it("should generate proper YAML output", async () => {
      const result = await executeTool(
        frontmatterEditor,
        {
          input: "Content only",
        },
        {
          updates: {
            title: "My Document",
            draft: true,
          },
        }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toMatch(
          /^---\n/
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "title: My Document"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "draft: true"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "\n---\n"
        );
      }
    });

    it("should handle empty document", async () => {
      const result = await executeTool(frontmatterEditor, {
        input: "",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hasFrontmatter).toBe(
          false
        );
        expect((result.data as Record<string, unknown>).content).toBe("");
      }
    });
  });
});
