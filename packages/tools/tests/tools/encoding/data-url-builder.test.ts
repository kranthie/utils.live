import { describe, it, expect } from "vitest";
import { dataUrlBuilder } from "../../../src/tools/encoding/data-url-builder";
import { executeTool } from "../../../src/core/executor";

describe("dataUrlBuilder", () => {
  it("should have correct metadata", () => {
    expect(dataUrlBuilder.meta.id).toBe("encoding/data-url-builder");
  });

  it("should build base64 data URL", async () => {
    const result = await executeTool(dataUrlBuilder, { input: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output.startsWith("data:text/plain;charset=utf-8;base64,")).toBe(
        true
      );
      expect(output).toContain("SGVsbG8");
    }
  });

  it("should build UTF-8 data URL", async () => {
    const result = await executeTool(
      dataUrlBuilder,
      { input: "Hello World" },
      { encoding: "utf8" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output.startsWith("data:text/plain;charset=utf-8,")).toBe(true);
      expect(output).toContain("Hello%20World");
    }
  });

  it("should support custom MIME type", async () => {
    const result = await executeTool(
      dataUrlBuilder,
      { input: "<h1>Hello</h1>" },
      { mimeType: "text/html" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("data:text/html");
    }
  });

  it("should handle empty content", async () => {
    const result = await executeTool(dataUrlBuilder, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output.startsWith("data:")).toBe(true);
    }
  });
});
