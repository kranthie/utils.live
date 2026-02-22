import { describe, it, expect } from "vitest";
import { punycodeDecode } from "../../../src/tools/encoding/punycode-decode";
import { executeTool } from "../../../src/core/executor";

describe("punycodeDecode", () => {
  it("should have correct metadata", () => {
    expect(punycodeDecode.meta.id).toBe("encoding/punycode-decode");
  });

  it("should decode a punycode domain", async () => {
    const result = await executeTool(punycodeDecode, {
      input: "xn--mnchen-3ya.de",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const output = (result.data as { output: string }).output;
      expect(output).toContain("münchen");
      expect(output).toContain(".de");
    }
  });

  it("should pass through ASCII labels", async () => {
    const result = await executeTool(punycodeDecode, { input: "example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as { output: string }).output).toBe("example.com");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(punycodeDecode, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should roundtrip with encode", async () => {
    const { punycodeEncode } =
      await import("../../../src/tools/encoding/punycode-encode");
    const encResult = await executeTool(punycodeEncode, {
      input: "münchen.de",
    });
    expect(encResult.success).toBe(true);
    if (encResult.success) {
      const decResult = await executeTool(punycodeDecode, {
        input: (encResult.data as { output: string }).output,
      });
      expect(decResult.success).toBe(true);
      if (decResult.success) {
        expect((decResult.data as { output: string }).output).toBe(
          "münchen.de"
        );
      }
    }
  });
});
