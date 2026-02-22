import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { regexExplainer } from "../../../src/tools/regex/regex-explainer";

describe("Regex Explainer", () => {
  it("should explain simple patterns", async () => {
    const result = await executeTool(regexExplainer, { input: "\\d+" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "digit"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "one or more"
      );
    }
  });

  it("should explain anchors", async () => {
    const result = await executeTool(regexExplainer, { input: "^hello$" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "start"
      );
      expect((result.data as Record<string, unknown>).output).toContain("end");
    }
  });

  it("should explain character classes", async () => {
    const result = await executeTool(regexExplainer, { input: "[a-z]" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "character in"
      );
    }
  });

  it("should fail on empty pattern", async () => {
    const result = await executeTool(regexExplainer, { input: "" });
    expect(result.success).toBe(false);
  });
});
