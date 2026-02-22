import { describe, it, expect } from "vitest";
import { prefixSuffixAdder } from "../../../src/tools/text/prefix-suffix-adder";
import { executeTool } from "../../../src/core/executor";

describe("prefixSuffixAdder", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(prefixSuffixAdder.meta.id).toBe("text/prefix-suffix-adder");
      expect(prefixSuffixAdder.meta.name).toBe("Prefix/Suffix Adder");
      expect(prefixSuffixAdder.meta.category).toBe("text");
    });
  });

  describe("execute", () => {
    describe("prefix", () => {
      it("should add prefix to single line", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "hello" },
          { prefix: "> " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "> hello"
          );
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            1
          );
        }
      });

      it("should add prefix to multiple lines", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "line1\nline2\nline3" },
          { prefix: "// " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "// line1\n// line2\n// line3"
          );
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            3
          );
        }
      });
    });

    describe("suffix", () => {
      it("should add suffix to single line", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "hello" },
          { suffix: ";" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "hello;"
          );
        }
      });

      it("should add suffix to multiple lines", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "const a = 1\nconst b = 2" },
          { suffix: ";" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "const a = 1;\nconst b = 2;"
          );
        }
      });
    });

    describe("prefix and suffix together", () => {
      it("should add both prefix and suffix", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "item" },
          { prefix: "<li>", suffix: "</li>" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "<li>item</li>"
          );
        }
      });

      it("should add prefix and suffix to all lines", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "one\ntwo" },
          { prefix: '"', suffix: '",' }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '"one",\n"two",'
          );
        }
      });
    });

    describe("options", () => {
      it("should skip empty lines when option enabled", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "line1\n\nline3" },
          { prefix: "> ", skipEmpty: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "> line1\n\n> line3"
          );
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            2
          );
        }
      });

      it("should not skip empty lines by default", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "line1\n\nline3" },
          { prefix: "> " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "> line1\n> \n> line3"
          );
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            3
          );
        }
      });

      it("should trim lines before adding when option enabled", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "  hello  \n  world  " },
          { prefix: "> ", trimFirst: true }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "> hello\n> world"
          );
        }
      });

      it("should preserve whitespace by default", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "  hello  " },
          { prefix: "> " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            ">   hello  "
          );
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "" },
          { prefix: "> " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("> ");
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            1
          );
        }
      });

      it("should handle no prefix or suffix", async () => {
        const result = await executeTool(prefixSuffixAdder, {
          input: "hello",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe("hello");
        }
      });

      it("should handle Windows line endings", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "line1\r\nline2" },
          { prefix: "> " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "> line1\n> line2"
          );
        }
      });

      it("should handle special characters in prefix/suffix", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "text" },
          { prefix: "$", suffix: "$$" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "$text$$"
          );
        }
      });

      it("should handle unicode prefix/suffix", async () => {
        const result = await executeTool(
          prefixSuffixAdder,
          { input: "text" },
          { prefix: ">>> ", suffix: " <<<" }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            ">>> text <<<"
          );
        }
      });

      it("should handle many lines", async () => {
        const lines = Array(100).fill("line").join("\n");
        const result = await executeTool(
          prefixSuffixAdder,
          { input: lines },
          { prefix: "# " }
        );
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).linesProcessed).toBe(
            100
          );
        }
      });
    });
  });
});
