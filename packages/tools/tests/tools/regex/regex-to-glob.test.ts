import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexToGlob } from "../../../src/tools/regex/regex-to-glob";

describe("Regex to Glob", () => {
  it("should convert .* to **", async () => {
    const result = await executeTool(regexToGlob, { input: "^.*\\.js$" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("**");
      expect((result.data as Record<string, unknown>).output).toContain(".js");
    }
  });

  it("should convert single dot to ?", async () => {
    const result = await executeTool(regexToGlob, { input: "^.oo$" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("?");
    }
  });

  it("should convert alternation to brace expansion", async () => {
    const result = await executeTool(regexToGlob, { input: "(foo|bar)" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "{foo,bar}"
      );
    }
  });

  it("should fail on empty pattern", async () => {
    const result = await executeTool(regexToGlob, { input: "" });
    expect(result.success).toBe(false);
  });
});
