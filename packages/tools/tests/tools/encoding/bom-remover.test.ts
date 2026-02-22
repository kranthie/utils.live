import { describe, it, expect } from "vitest";
import { bomRemover } from "../../../src/tools/encoding/bom-remover";
import { executeTool } from "../../../src/core/executor";

describe("bomRemover", () => {
  it("should have correct metadata", () => {
    expect(bomRemover.meta.id).toBe("encoding/bom-remover");
  });

  it("should remove BOM from start of text", async () => {
    const result = await executeTool(bomRemover, { input: "\uFEFFHello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should remove BOM from middle of text", async () => {
    const result = await executeTool(bomRemover, { input: "Hello\uFEFFWorld" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("HelloWorld");
    }
  });

  it("should pass through text without BOM", async () => {
    const result = await executeTool(bomRemover, { input: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(bomRemover, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });
});
