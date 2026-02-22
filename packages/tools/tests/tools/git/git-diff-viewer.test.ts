import { describe, it, expect } from "vitest";
import { gitDiffViewer } from "../../../src/tools/git/git-diff-viewer";
import { executeTool } from "../../../src/core/executor";

describe("gitDiffViewer", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(gitDiffViewer.meta.id).toBe("git/git-diff-viewer");
      expect(gitDiffViewer.meta.category).toBe("git");
    });
  });

  describe("execute", () => {
    it("should pass through original and modified content", async () => {
      const result = await executeTool(gitDiffViewer, {
        input1: "line1\nline2\nline3",
        input2: "line1\nmodified\nline3",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.original).toBe("line1\nline2\nline3");
        expect(data.modified).toBe("line1\nmodified\nline3");
      }
    });

    it("should handle identical content", async () => {
      const result = await executeTool(gitDiffViewer, {
        input1: "hello world",
        input2: "hello world",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.original).toBe("hello world");
        expect(data.modified).toBe("hello world");
      }
    });

    it("should handle empty inputs", async () => {
      const result = await executeTool(gitDiffViewer, {
        input1: "",
        input2: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.original).toBe("");
        expect(data.modified).toBe("");
      }
    });

    it("should preserve content unchanged", async () => {
      const result = await executeTool(gitDiffViewer, {
        input1: "old content",
        input2: "new content",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as Record<string, unknown>;
        expect(data.original).toBe("old content");
        expect(data.modified).toBe("new content");
      }
    });
  });
});
