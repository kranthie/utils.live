import { describe, it, expect } from "vitest";
import { jsoncStripper } from "../../../src/tools/data/jsonc-stripper";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface JsoncStripperOutput {
  output: string;
  commentsRemoved: number;
}

describe("jsoncStripper", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(jsoncStripper.meta.id).toBe("data/jsonc-stripper");
    });

    it("should have correct name", () => {
      expect(jsoncStripper.meta.name).toBe("JSONC Stripper");
    });

    it("should be in data category", () => {
      expect(jsoncStripper.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(jsoncStripper.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(jsoncStripper.meta.keywords).toContain("jsonc");
      expect(jsoncStripper.meta.keywords).toContain("comments");
      expect(jsoncStripper.meta.keywords).toContain("strip");
    });
  });

  describe("execute", () => {
    it("should strip single-line comments", async () => {
      const input = `{
  "name": "test", // This is a comment
  "value": 123
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(1);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should strip multi-line comments", async () => {
      const input = `{
  /* This is a
     multi-line comment */
  "name": "test",
  "value": 123
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(1);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
      }
    });

    it("should strip multiple comments", async () => {
      const input = `{
  // Comment 1
  "name": "test", // Comment 2
  /* Comment 3 */
  "value": 123 // Comment 4
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(4);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should remove trailing commas", async () => {
      const input = `{
  "name": "test",
  "value": 123,
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
        expect(parsed.value).toBe(123);
      }
    });

    it("should remove trailing commas in arrays", async () => {
      const input = `{
  "items": [1, 2, 3,]
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.items).toEqual([1, 2, 3]);
      }
    });

    it("should not strip comment-like content in strings", async () => {
      const input = `{
  "url": "http://example.com",
  "description": "This is // not a comment",
  "pattern": "/* also not a comment */"
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(0);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.url).toBe("http://example.com");
        expect(parsed.description).toBe("This is // not a comment");
        expect(parsed.pattern).toBe("/* also not a comment */");
      }
    });

    it("should handle valid JSON without comments", async () => {
      const input = `{"name": "test", "value": 123}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(0);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.name).toBe("test");
      }
    });

    it("should handle nested objects", async () => {
      const input = `{
  "outer": {
    // Inner comment
    "inner": {
      "value": 42 /* another comment */
    }
  }
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(2);
        const parsed = JSON.parse(data.output) as {
          outer: { inner: { value: number } };
        };
        expect(parsed.outer.inner.value).toBe(42);
      }
    });

    it("should handle arrays with comments", async () => {
      const input = `{
  "items": [
    1, // first
    2, // second
    3  // third
  ]
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(3);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.items).toEqual([1, 2, 3]);
      }
    });

    it("should handle empty object", async () => {
      const input = `{}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(0);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed).toEqual({});
      }
    });

    it("should handle empty array", async () => {
      const input = `[]`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        const parsed = JSON.parse(data.output) as unknown[];
        expect(parsed).toEqual([]);
      }
    });

    it("should fail for invalid JSON after stripping", async () => {
      const input = `{invalid json`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("JSONC_PARSE_ERROR");
      }
    });

    it("should handle strings with escaped quotes", async () => {
      const input = `{
  "message": "He said \\"Hello\\"", // comment
  "value": 1
}`;
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(1);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.message).toBe('He said "Hello"');
      }
    });

    it("should include execution metadata", async () => {
      const result = await executeTool(jsoncStripper, {
        input: '{"test": true}',
      });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("escape detection edge cases", () => {
    it("should handle string ending with escaped backslash before comment", async () => {
      // "test\\" in JSON means the value is: test\
      // The closing quote after \\ is NOT escaped (even backslash count = not escaped)
      const input = '{"a": "test\\\\"} // comment';
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(1);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.a).toBe("test\\");
      }
    });

    it("should handle string ending with four backslashes (two escaped backslashes) before comment", async () => {
      // "\\\\" in JSON means value is: \\  (two backslashes)
      const input = '{"a": "\\\\\\\\"} // comment';
      const result = await executeTool(jsoncStripper, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as JsoncStripperOutput;
        expect(data.commentsRemoved).toBe(1);
        const parsed = JSON.parse(data.output) as Record<string, unknown>;
        expect(parsed.a).toBe("\\\\");
      }
    });
  });

  describe("execute function directly", () => {
    it("should strip comments when called directly", () => {
      const result = jsoncStripper.execute({
        input: '{"name": "test"} // comment',
      }) as Record<string, unknown>;
      expect(result.commentsRemoved).toBe(1);
    });
  });
});
