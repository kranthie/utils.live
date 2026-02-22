import { describe, it, expect } from "vitest";
import { htmlEntityDecode } from "../../../src/tools/encoding/html-entity-decode";
import { executeTool } from "../../../src/core/executor";

describe("htmlEntityDecode", () => {
  it("should have correct metadata", () => {
    expect(htmlEntityDecode.meta.id).toBe("encoding/html-entity-decode");
  });

  it("should decode named entities", async () => {
    const result = await executeTool(htmlEntityDecode, {
      input: "&lt;div&gt;&amp;&lt;/div&gt;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("<div>&</div>");
    }
  });

  it("should decode numeric entities", async () => {
    const result = await executeTool(htmlEntityDecode, { input: "&#60;&#62;" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("<>");
    }
  });

  it("should decode hex entities", async () => {
    const result = await executeTool(htmlEntityDecode, {
      input: "&#x3C;&#x3E;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("<>");
    }
  });

  it("should handle mixed entities", async () => {
    const result = await executeTool(htmlEntityDecode, {
      input: "&amp; &#38; &#x26;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("& & &");
    }
  });

  it("should pass through text without entities", async () => {
    const result = await executeTool(htmlEntityDecode, {
      input: "hello world",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("hello world");
    }
  });
});
