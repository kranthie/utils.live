import { describe, it, expect } from "vitest";
import { base58EncodeDecode } from "../../../src/tools/encoding/base58-encode-decode";
import { executeTool } from "../../../src/core/executor";

describe("base58EncodeDecode", () => {
  it("should have correct metadata", () => {
    expect(base58EncodeDecode.meta.id).toBe("encoding/base58-encode-decode");
  });

  it("should encode text to Base58", async () => {
    const result = await executeTool(
      base58EncodeDecode,
      { input: "Hello" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("9Ajdvzr");
    }
  });

  it("should decode Base58 to text", async () => {
    const result = await executeTool(
      base58EncodeDecode,
      { input: "9Ajdvzr" },
      { mode: "decode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hello");
    }
  });

  it("should handle empty string", async () => {
    const result = await executeTool(
      base58EncodeDecode,
      { input: "" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("");
    }
  });

  it("should fail on invalid Base58 characters", async () => {
    const result = await executeTool(
      base58EncodeDecode,
      { input: "0OIl" },
      { mode: "decode" }
    );
    expect(result.success).toBe(false);
  });

  it("should roundtrip", async () => {
    const encResult = await executeTool(
      base58EncodeDecode,
      { input: "Bitcoin!" },
      { mode: "encode" }
    );
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(
        base58EncodeDecode,
        { input: (encResult.data as { output: string }).output },
        { mode: "decode" }
      );
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as { output: string }).output).toBe("Bitcoin!");
      }
    }
  });
});
