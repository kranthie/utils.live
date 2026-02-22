import { describe, it, expect } from "vitest";
import { charsetDetector } from "../../../src/tools/encoding/charset-detector";
import { executeTool } from "../../../src/core/executor";

describe("charsetDetector", () => {
  it("should have correct metadata", () => {
    expect(charsetDetector.meta.id).toBe("encoding/charset-detector");
  });

  it("should detect pure ASCII text", async () => {
    const result = await executeTool(charsetDetector, { input: "Hello World" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("ASCII");
      expect(output).toContain("100.0%");
    }
  });

  it("should detect non-ASCII characters", async () => {
    const result = await executeTool(charsetDetector, { input: "Hello 世界" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("NOT ASCII");
    }
  });

  it("should show size estimates", async () => {
    const result = await executeTool(charsetDetector, { input: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("Size Estimates");
      expect(output).toContain("UTF-8:");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(charsetDetector, { input: "" });
    expect(result.success).toBe(false);
  });
});
