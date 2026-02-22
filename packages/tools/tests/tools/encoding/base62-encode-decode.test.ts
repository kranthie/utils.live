import { describe, it, expect } from "vitest";
import { base62EncodeDecode } from "../../../src/tools/encoding/base62-encode-decode";
import { executeTool } from "../../../src/core/executor";

describe("base62EncodeDecode", () => {
  it("should have correct metadata", () => {
    expect(base62EncodeDecode.meta.id).toBe("encoding/base62-encode-decode");
  });

  it("should encode text to Base62", async () => {
    const result = await executeTool(
      base62EncodeDecode,
      { input: "Hi" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toBeTruthy();
      // Should only contain alphanumeric
      expect(output).toMatch(/^[0-9A-Za-z]+$/);
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(
      base62EncodeDecode,
      { input: "" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should fail on invalid Base62 characters in decode", async () => {
    const result = await executeTool(
      base62EncodeDecode,
      { input: "!!!" },
      { mode: "decode" }
    );
    expect(result.success).toBe(false);
  });

  it("should roundtrip", async () => {
    const encResult = await executeTool(
      base62EncodeDecode,
      { input: "test" },
      { mode: "encode" }
    );
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(
        base62EncodeDecode,
        { input: (encResult.data as { output: string }).output },
        { mode: "decode" }
      );
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as { output: string }).output).toBe("test");
      }
    }
  });
});
