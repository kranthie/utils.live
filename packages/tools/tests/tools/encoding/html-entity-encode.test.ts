import { describe, it, expect } from "vitest";
import { htmlEntityEncode } from "../../../src/tools/encoding/html-entity-encode";
import { executeTool } from "../../../src/core/executor";

describe("htmlEntityEncode", () => {
  it("should have correct metadata", () => {
    expect(htmlEntityEncode.meta.id).toBe("encoding/html-entity-encode");
  });

  it("should encode HTML special characters with named entities", async () => {
    const result = await executeTool(htmlEntityEncode, {
      input: '<div class="test">&</div>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("&lt;");
      expect(output).toContain("&gt;");
      expect(output).toContain("&amp;");
      expect(output).toContain("&quot;");
    }
  });

  it("should encode to numeric entities", async () => {
    const result = await executeTool(
      htmlEntityEncode,
      { input: "<>" },
      { mode: "numeric" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("&#60;");
      expect(output).toContain("&#62;");
    }
  });

  it("should encode to hex entities", async () => {
    const result = await executeTool(
      htmlEntityEncode,
      { input: "<>" },
      { mode: "hex" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("&#x3C;");
      expect(output).toContain("&#x3E;");
    }
  });

  it("should encode all characters when encodeAll is true", async () => {
    const result = await executeTool(
      htmlEntityEncode,
      { input: "abc" },
      { encodeAll: true, mode: "numeric" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBe("&#97;&#98;&#99;");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(htmlEntityEncode, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });
});
