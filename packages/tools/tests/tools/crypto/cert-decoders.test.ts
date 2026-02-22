import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { csrDecoder } from "../../../src/tools/crypto/csr-decoder";
import { certificateDecoder } from "../../../src/tools/crypto/certificate-decoder";

// A minimal self-signed X.509 certificate for testing
const TEST_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAJHHnpYBcPH3MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMTBnRl
c3RDQTAQGA8yMDE1MDEwMTAwMDAwMFoYDzIwMjUwMTAxMDAwMDAwWjATMREwDwYD
VQQDEwh0ZXN0Q2VydDBcMA0GCSqGSIb3DQEBAQUAAwsAMEgCQQC5MVHKaY1FJ1ss
VOMnLiE+xMCrD3j3b6AqsP1uxPKOoiAJBBi1iQEH3WLnB7QjVDDMoaxNHwMi8zX
ME47mQHTAgMBAAEwDQYJKoZIhvcNAQELBQADQQBTCfvLNbhGpIotzY0QlM98v8ls
aC3OpPCiz4sDByM3oCAEPEbGPc2QQED7iu1tBcNHa2pKr9TICPCgKv+VjLwM
-----END CERTIFICATE-----`;

// A minimal CSR for testing
const TEST_CSR = `-----BEGIN CERTIFICATE REQUEST-----
MIIBBDCBrwIBADBNMQswCQYDVQQGEwJVUzETMBEGA1UECAwKQ2FsaWZvcm5pYTEW
MBQGA1UEBwwNU2FuIEZyYW5jaXNjbzERMA8GA1UECgwIVGVzdCBPcmcwXDANBgkq
hkiG9w0BAQEFAANLADBIAkEAubFRymmNRSdbLFTjJy4hPsTAqw94928gKrD9bsTy
jqIgCQQYtYkBB91i5we0I1QwzKGsTR8DIvM1TjuZAdMCAwEAAaAAMA0GCSqGSIb3
DQEBCwUAA0EAUyJfkbGUHWkJVExn65pCGkLLkh0MCZE8+LCBzFODe91ROJeDI6X4
uaLheCBJlRxNqfmfCHOGJ4mqP4S8TQmCEA==
-----END CERTIFICATE REQUEST-----`;

describe("Certificate Decoder", () => {
  it("should decode a PEM certificate", async () => {
    const result = await executeTool(certificateDecoder, {
      input: TEST_CERTIFICATE,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "X.509 Certificate"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "bytes"
      );
    }
  });

  it("should detect algorithms in certificate", async () => {
    const result = await executeTool(certificateDecoder, {
      input: TEST_CERTIFICATE,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Algorithms:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "SHA-256 with RSA"
      );
    }
  });

  it("should show certificate size", async () => {
    const result = await executeTool(certificateDecoder, {
      input: TEST_CERTIFICATE,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Total size:"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "284 bytes"
      );
    }
  });

  it("should fail on invalid PEM", async () => {
    const result = await executeTool(certificateDecoder, {
      input: "not a certificate",
    });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(certificateDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});

describe("CSR Decoder", () => {
  it("should decode a PEM CSR", async () => {
    const result = await executeTool(csrDecoder, { input: TEST_CSR });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Certificate Signing Request"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "bytes"
      );
    }
  });

  it("should extract subject fields from CSR", async () => {
    const result = await executeTool(csrDecoder, { input: TEST_CSR });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("US");
      expect((result.data as Record<string, unknown>).output).toContain(
        "California"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "San Francisco"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Test Org"
      );
    }
  });

  it("should list OIDs found", async () => {
    const result = await executeTool(csrDecoder, { input: TEST_CSR });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Algorithms/OIDs found:"
      );
      expect((result.data as Record<string, unknown>).output).toContain("RSA");
    }
  });

  it("should fail on invalid CSR", async () => {
    const result = await executeTool(csrDecoder, { input: "not a csr" });
    expect(result.success).toBe(false);
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(csrDecoder, { input: "" });
    expect(result.success).toBe(false);
  });
});
