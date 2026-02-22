import { describe, it, expect } from "vitest";
import { hexDecode } from "../../../src/tools/encoding/hex-decode";
import { executeTool } from "../../../src/core/executor";

describe("hexDecode", () => {
  it("should have correct metadata", () => {
    expect(hexDecode.meta.id).toBe("encoding/hex-decode");
  });

  it("should decode hex to text", async () => {
    const result = await executeTool(hexDecode, { input: "48656c6c6f" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should handle 0x prefix", async () => {
    const result = await executeTool(hexDecode, { input: "0x4869" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle space separators", async () => {
    const result = await executeTool(hexDecode, { input: "48 69" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should handle colon separators", async () => {
    const result = await executeTool(hexDecode, { input: "48:65:6c:6c:6f" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should fail on odd length hex", async () => {
    const result = await executeTool(hexDecode, { input: "486" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid hex characters", async () => {
    const result = await executeTool(hexDecode, { input: "ZZZZ" });
    expect(result.success).toBe(false);
  });
});
