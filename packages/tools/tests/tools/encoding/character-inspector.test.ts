import { describe, it, expect } from "vitest";
import { characterInspector } from "../../../src/tools/encoding/character-inspector";
import { executeTool } from "../../../src/core/executor";

describe("characterInspector", () => {
  it("should have correct metadata", () => {
    expect(characterInspector.meta.id).toBe("encoding/character-inspector");
  });

  it("should inspect ASCII text", async () => {
    const result = await executeTool(characterInspector, { input: "Hi" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Code points: 2");
      expect(output).toContain("U+0048");
      expect(output).toContain("U+0069");
    }
  });

  it("should detect emoji characters", async () => {
    const result = await executeTool(characterInspector, { input: "🌍" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Emoji");
    }
  });

  it("should show UTF-8 byte lengths", async () => {
    const result = await executeTool(characterInspector, { input: "A" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("41");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(characterInspector, { input: "" });
    expect(result.success).toBe(false);
  });
});
