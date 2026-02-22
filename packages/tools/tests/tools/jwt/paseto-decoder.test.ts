import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { pasetoDecoder } from "../../../src/tools/jwt/paseto-decoder";

describe("PASETO Decoder", () => {
  it("should decode a v4.local token structure", async () => {
    const token = "v4.local.dGVzdHBheWxvYWQ";
    const result = await executeTool(pasetoDecoder, { input: token });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).version).toBe("v4");
      expect((result.data as Record<string, unknown>).purpose).toBe("local");
      expect((result.data as Record<string, unknown>).payload).toBe(
        "dGVzdHBheWxvYWQ"
      );
    }
  });

  it("should decode footer when present", async () => {
    const footer = btoa("key-id:abc")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `v2.public.dGVzdA.${footer}`;
    const result = await executeTool(pasetoDecoder, { input: token });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).footer).toContain(
        "key-id:abc"
      );
    }
  });

  it("should fail for invalid version", async () => {
    const result = await executeTool(pasetoDecoder, { input: "v9.local.test" });
    expect(result.success).toBe(false);
  });

  it("should fail for empty input", async () => {
    const result = await executeTool(pasetoDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});
