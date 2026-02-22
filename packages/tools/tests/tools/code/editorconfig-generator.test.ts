import { describe, it, expect } from "vitest";
import { editorconfigGenerator } from "../../../src/tools/code/editorconfig-generator";
import { executeTool } from "../../../src/core/executor";

describe("editorconfigGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(editorconfigGenerator.meta.id).toBe("code/editorconfig-generator");
      expect(editorconfigGenerator.meta.category).toBe("code");
    });
  });

  describe("execute", () => {
    it("should generate default editorconfig", async () => {
      const result = await executeTool(editorconfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("root = true");
        expect(output).toContain("[*]");
        expect(output).toContain("indent_style = space");
        expect(output).toContain("indent_size = 2");
        expect(output).toContain("end_of_line = lf");
        expect(output).toContain("charset = utf-8");
      }
    });

    it("should use tab indent when specified", async () => {
      const result = await executeTool(editorconfigGenerator, {
        indentStyle: "tab",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("indent_style = tab");
      }
    });

    it("should include markdown section when includeMarkdown is true", async () => {
      const result = await executeTool(editorconfigGenerator, {
        includeMarkdown: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("[*.md]");
        expect(output).toContain("trim_trailing_whitespace = false");
      }
    });

    it("should exclude markdown section when includeMarkdown is false", async () => {
      const result = await executeTool(editorconfigGenerator, {
        includeMarkdown: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("[*.md]");
      }
    });

    it("should include Makefile section when includeMakefile is true", async () => {
      const result = await executeTool(editorconfigGenerator, {
        includeMakefile: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("[Makefile]");
        expect(output).toContain("indent_style = tab");
      }
    });

    it("should omit max_line_length when set to 0", async () => {
      const result = await executeTool(editorconfigGenerator, {
        maxLineLength: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).not.toContain("max_line_length = 0");
      }
    });

    it("should include json/yaml section", async () => {
      const result = await executeTool(editorconfigGenerator, {});
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>).output as string;
        expect(output).toContain("[*.{json,yml,yaml}]");
      }
    });
  });
});
