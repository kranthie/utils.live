import { describe, it, expect } from "vitest";
import { base32EncodeDecode } from "../../../src/tools/encoding/base32-encode-decode";
import { executeTool } from "../../../src/core/executor";

describe("base32EncodeDecode", () => {
  it("should have correct metadata", () => {
    expect(base32EncodeDecode.meta.id).toBe("encoding/base32-encode-decode");
  });

  it("should encode text to Base32", async () => {
    const result = await executeTool(
      base32EncodeDecode,
      { input: "Hello" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("JBSWY3DP");
    }
  });

  it("should decode Base32 back to text", async () => {
    const result = await executeTool(
      base32EncodeDecode,
      { input: "JBSWY3DP" },
      { mode: "decode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should handle encoding without padding", async () => {
    const result = await executeTool(
      base32EncodeDecode,
      { input: "Hi" },
      { mode: "encode", padding: false }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).not.toContain("=");
    }
  });

  it("should fail on invalid Base32 characters in decode mode", async () => {
    const result = await executeTool(
      base32EncodeDecode,
      { input: "12345" },
      { mode: "decode" }
    );
    expect(result.success).toBe(false);
  });

  it("should roundtrip", async () => {
    const encResult = await executeTool(
      base32EncodeDecode,
      { input: "test data" },
      { mode: "encode" }
    );
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(
        base32EncodeDecode,
        { input: (encResult.data as { output: string }).output },
        { mode: "decode" }
      );
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as { output: string }).output).toBe("test data");
      }
    }
  });
});
