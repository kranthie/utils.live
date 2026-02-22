import { describe, it, expect } from "vitest";
import { responseFormatter } from "../../../src/tools/api/response-formatter";
import { executeTool } from "../../../src/core/executor";

describe("responseFormatter", () => {
  it("should have correct metadata", () => {
    expect(responseFormatter.meta.id).toBe("api/response-formatter");
    expect(responseFormatter.meta.category).toBe("api");
  });

  it("should format JSON with default indent", async () => {
    const result = await executeTool(responseFormatter, {
      input: '{"name":"Alice","age":30}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain('"name": "Alice"');
      expect(output).toContain('"age": 30');
    }
  });

  it("should format JSON with custom indent", async () => {
    const result = await executeTool(
      responseFormatter,
      { input: '{"a":1}' },
      { indent: 4 }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("    "); // 4-space indent
    }
  });

  it("should sort keys when option enabled", async () => {
    const result = await executeTool(
      responseFormatter,
      { input: '{"z":1,"a":2,"m":3}' },
      { sortKeys: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      const aIdx = output.indexOf('"a"');
      const mIdx = output.indexOf('"m"');
      const zIdx = output.indexOf('"z"');
      expect(aIdx).toBeLessThan(mIdx);
      expect(mIdx).toBeLessThan(zIdx);
    }
  });

  it("should sort keys recursively", async () => {
    const result = await executeTool(
      responseFormatter,
      { input: '{"obj":{"z":1,"a":2}}' },
      { sortKeys: true }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      const parsed = JSON.parse(output) as { obj: Record<string, unknown> };
      const keys = Object.keys(parsed.obj);
      expect(keys[0]).toBe("a");
      expect(keys[1]).toBe("z");
    }
  });

  it("should format XML", async () => {
    const xml = "<root><name>Alice</name><age>30</age></root>";
    const result = await executeTool(responseFormatter, { input: xml });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("<root>");
      expect(output).toContain("<name>Alice</name>");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(responseFormatter, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on non-JSON/XML input", async () => {
    const result = await executeTool(responseFormatter, {
      input: "just plain text, not json or xml",
    });
    expect(result.success).toBe(false);
  });
});
