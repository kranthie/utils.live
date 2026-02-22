import { describe, it, expect } from "vitest";
import { base64urlDecode } from "../../../src/tools/encoding/base64url-decode";
import { executeTool } from "../../../src/core/executor";

describe("base64urlDecode", () => {
  it("should have correct tool metadata", () => {
    expect(base64urlDecode.meta.id).toBe("encoding/base64url-decode");
    expect(base64urlDecode.meta.category).toBe("encoding");
  });

  it("should decode URL-safe base64", async () => {
    const result = await executeTool(base64urlDecode, {
      input: "SGVsbG8sIFdvcmxkIQ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello, World!");
    }
  });

  it("should handle base64url with - and _", async () => {
    const result = await executeTool(base64urlDecode, { input: "Pj4-Pz8_" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe(">>>???");
    }
  });

  it("should fail on invalid characters", async () => {
    const result = await executeTool(base64urlDecode, {
      input: "!!!invalid!!!",
    });
    expect(result.success).toBe(false);
  });

  it("should roundtrip with encode", async () => {
    const { base64urlEncode } =
      await import("../../../src/tools/encoding/base64url-encode");
    const encResult = await executeTool(base64urlEncode, {
      input: "Test 123 こんにちは",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(base64urlDecode, {
        input: (encResult.data as { output: string }).output,
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as { output: string }).output).toBe(
          "Test 123 こんにちは"
        );
      }
    }
  });
});
