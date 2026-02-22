import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { rsaKeyGenerator } from "../../../src/tools/crypto/rsa-key-generator";
import { ecKeyGenerator } from "../../../src/tools/crypto/ec-key-generator";
import { ed25519KeyGenerator } from "../../../src/tools/crypto/ed25519-key-generator";
import { pemParser } from "../../../src/tools/crypto/pem-parser";
import { jwkConverter } from "../../../src/tools/crypto/jwk-converter";
import { keyFingerprint } from "../../../src/tools/crypto/key-fingerprint";

describe("RSA Key Generator", () => {
  it("should generate RSA-2048 JWK keypair", async () => {
    const result = await executeTool(rsaKeyGenerator, {
      modulusLength: "2048",
      format: "jwk",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Public Key (JWK)"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Private Key (JWK)"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        '"kty": "RSA"'
      );
    }
  });

  it("should generate RSA-2048 PEM keypair", async () => {
    const result = await executeTool(rsaKeyGenerator, {
      modulusLength: "2048",
      format: "pkcs8",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "-----BEGIN PUBLIC KEY-----"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "-----BEGIN PRIVATE KEY-----"
      );
    }
  });

  it("should generate different keys each time", async () => {
    const r1 = await executeTool(rsaKeyGenerator, {
      modulusLength: "2048",
      format: "jwk",
    });
    const r2 = await executeTool(rsaKeyGenerator, {
      modulusLength: "2048",
      format: "jwk",
    });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});

describe("EC Key Generator", () => {
  it("should generate P-256 JWK keypair", async () => {
    const result = await executeTool(ecKeyGenerator, {
      curve: "P-256",
      format: "jwk",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        '"kty": "EC"'
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        '"crv": "P-256"'
      );
    }
  });

  it("should generate P-384 keypair", async () => {
    const result = await executeTool(ecKeyGenerator, {
      curve: "P-384",
      format: "jwk",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        '"crv": "P-384"'
      );
    }
  });

  it("should generate PEM format", async () => {
    const result = await executeTool(ecKeyGenerator, {
      curve: "P-256",
      format: "pkcs8",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "-----BEGIN PUBLIC KEY-----"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "-----BEGIN EC PRIVATE KEY-----"
      );
    }
  });
});

describe("Ed25519 Key Generator", () => {
  it("should generate hex keys", async () => {
    const result = await executeTool(ed25519KeyGenerator, { format: "hex" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Ed25519 Private Key"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Ed25519 Public Key"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "32 bytes"
      );
    }
  });

  it("should generate base64 keys", async () => {
    const result = await executeTool(ed25519KeyGenerator, { format: "base64" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Format: base64"
      );
    }
  });

  it("should generate different keys each time", async () => {
    const r1 = await executeTool(ed25519KeyGenerator, { format: "hex" });
    const r2 = await executeTool(ed25519KeyGenerator, { format: "hex" });
    expect(r1.success && r2.success).toBe(true);
    if (r1.success && r2.success) {
      expect((r1.data as Record<string, unknown>).output).not.toBe(
        (r2.data as Record<string, unknown>).output
      );
    }
  });
});

describe("PEM Parser", () => {
  it("should parse a PEM public key", async () => {
    const pem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMKBCTNIcKUSDii11ySs3526iDZ8A
iTo7Tu6KPAqv7D7gS2XVJeIol3rnJhmcJEJwGPDGLQiGkl2poXlY+yHpjQ==
-----END PUBLIC KEY-----`;
    const result = await executeTool(pemParser, { input: pem });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "PUBLIC KEY"
      );
      expect((result.data as Record<string, unknown>).output).toContain("SPKI");
    }
  });

  it("should fail on invalid PEM", async () => {
    const result = await executeTool(pemParser, { input: "not a pem" });
    expect(result.success).toBe(false);
  });

  it("should detect certificate type", async () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJHHnpYBcPH3MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMTBnRl
c3RDQTAQGA8yMDE1MDEwMTAwMDAwMFoYDzIwMjUwMTAxMDAwMDAwWjATMREwDwYD
VQQDEwh0ZXN0Q2VydDBcMA0GCSqGSIb3DQEBAQUAAwsAMEgCQQC5MVHKaY1FJ1ss
VOMnLiE+xMCrD3j3b6AqsP1uxPKOoiAJBBi1iQEH3WLnB7QjVDDMoaxNHwMi8zX
ME47mQHTAgMBAAEwDQYJKoZIhvcNAQELBQADQQBTCfvLNbhGpIotzY0QlM98v8ls
aC3OpPCiz4sDByM3oCAEPEbGPc2QQED7iu1tBcNHa2pKr9TICPCgKv+VjLwM
-----END CERTIFICATE-----`;
    const result = await executeTool(pemParser, { input: pem });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "X.509 Certificate"
      );
    }
  });
});

describe("JWK Converter", () => {
  it("should display JWK info", async () => {
    const jwk = JSON.stringify({ kty: "RSA", n: "0vx7agoebGcQ", e: "AQAB" });
    const result = await executeTool(jwkConverter, { input: jwk });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("RSA");
      expect((result.data as Record<string, unknown>).output).toContain(
        "Public key only"
      );
    }
  });

  it("should identify EC keys", async () => {
    const jwk = JSON.stringify({
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
    });
    const result = await executeTool(jwkConverter, { input: jwk });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Elliptic Curve"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "P-256"
      );
    }
  });

  it("should fail on non-JSON input", async () => {
    const result = await executeTool(jwkConverter, { input: "not json" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid JWK (no kty)", async () => {
    const result = await executeTool(jwkConverter, { input: '{"foo": "bar"}' });
    expect(result.success).toBe(false);
  });
});

describe("Key Fingerprint", () => {
  it("should compute fingerprint from PEM", async () => {
    const pem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMKBCTNIcKUSDii11ySs3526iDZ8A
iTo7Tu6KPAqv7D7gS2XVJeIol3rnJhmcJEJwGPDGLQiGkl2poXlY+yHpjQ==
-----END PUBLIC KEY-----`;
    const result = await executeTool(keyFingerprint, { input: pem });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-1:"
      );
    }
  });

  it("should be deterministic", async () => {
    const pem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMKBCTNIcKUSDii11ySs3526iDZ8A
iTo7Tu6KPAqv7D7gS2XVJeIol3rnJhmcJEJwGPDGLQiGkl2poXlY+yHpjQ==
-----END PUBLIC KEY-----`;
    const r1 = await executeTool(keyFingerprint, { input: pem });
    const r2 = await executeTool(keyFingerprint, { input: pem });
    expect(
      r1.success &&
        r2.success &&
        (r1.data as Record<string, unknown>).output ===
          (r2.data as Record<string, unknown>).output
    ).toBe(true);
  });

  it("should fail on invalid input", async () => {
    const result = await executeTool(keyFingerprint, { input: "not a key" });
    expect(result.success).toBe(false);
  });
});
