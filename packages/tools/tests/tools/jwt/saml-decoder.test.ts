import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { samlDecoder } from "../../../src/tools/jwt/saml-decoder";

describe("SAML Decoder", () => {
  it("should decode base64 SAML XML", async () => {
    const xml =
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"><Issuer>test</Issuer></samlp:Response>';
    const encoded = btoa(xml);
    const result = await executeTool(samlDecoder, { input: encoded });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isDeflated).toBe(false);
      expect((result.data as Record<string, unknown>).output).toContain(
        "samlp:Response"
      );
    }
  });

  it("should handle non-XML content", async () => {
    const encoded = btoa("\x00\x01\x02\x03");
    const result = await executeTool(samlDecoder, { input: encoded });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isDeflated).toBe(true);
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(samlDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});
