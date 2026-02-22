import { describe, it, expect } from "vitest";
import { octalConverter } from "../../../src/tools/encoding/octal-converter";
import { executeTool } from "../../../src/core/executor";

describe("octalConverter", () => {
  it("should have correct metadata", () => {
    expect(octalConverter.meta.id).toBe("encoding/octal-converter");
  });

  it("should encode text to octal", async () => {
    const result = await executeTool(
      octalConverter,
      { input: "Hi" },
      { mode: "encode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("110 151");
    }
  });

  it("should decode octal to text", async () => {
    const result = await executeTool(
      octalConverter,
      { input: "110 151" },
      { mode: "decode" }
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("Hi");
    }
  });

  it("should fail on invalid octal characters in decode", async () => {
    const result = await executeTool(
      octalConverter,
      { input: "189" },
      { mode: "decode" }
    );
    expect(result.success).toBe(false);
  });

  it("should roundtrip", async () => {
    const encResult = await executeTool(
      octalConverter,
      { input: "test" },
      { mode: "encode" }
    );
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(
        octalConverter,
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
