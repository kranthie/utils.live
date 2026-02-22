import { describe, it, expect } from "vitest";
import { dkimValidator } from "../../../src/tools/communication/dkim-validator";

interface DkimResult {
  valid: boolean;
  tags: {
    version: string;
    keyType: string;
    hashAlgorithms: string;
    flags: string;
    serviceType: string;
    publicKey: string;
    publicKeyLength: number;
    notes: string;
  };
  errors: string[];
  warnings: string[];
  rawTags: Record<string, string>;
}

describe("dkim-validator", () => {
  const execute = (input: string): DkimResult => {
    const result = dkimValidator.execute({ input }) as { output: string };
    return JSON.parse(result.output) as DkimResult;
  };

  it("validates a correct DKIM record", () => {
    const result = execute("v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.tags.version).toBe("DKIM1");
    expect(result.tags.keyType).toBe("rsa");
  });

  it("reports missing version tag", () => {
    const result = execute("k=rsa; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required 'v' tag (version)");
  });

  it("reports invalid version", () => {
    const result = execute("v=DKIM2; k=rsa; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Invalid version: 'DKIM2' (must be 'DKIM1')"
    );
  });

  it("reports missing public key tag", () => {
    const result = execute("v=DKIM1; k=rsa");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing required 'p' tag (public key)");
  });

  it("warns on unusual key type", () => {
    const result = execute("v=DKIM1; k=dsa; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      "Unusual key type: 'dsa' (expected: rsa or ed25519)"
    );
  });

  it("accepts ed25519 key type", () => {
    const result = execute("v=DKIM1; k=ed25519; p=abc123");
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.tags.keyType).toBe("ed25519");
  });

  it("validates hash algorithms", () => {
    const result = execute("v=DKIM1; h=sha256; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.tags.hashAlgorithms).toBe("sha256");
  });

  it("warns on sha1-only hash", () => {
    const result = execute("v=DKIM1; h=sha1; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      "SHA-1 only is deprecated; consider adding SHA-256"
    );
  });

  it("validates flags", () => {
    const result = execute("v=DKIM1; t=y:s; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.tags.flags).toBe("y:s");
  });

  it("warns on unknown flags", () => {
    const result = execute("v=DKIM1; t=x; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      "Unknown flag: 'x' (valid: y=testing, s=strict)"
    );
  });

  it("validates service type", () => {
    const result = execute("v=DKIM1; s=email; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.tags.serviceType).toBe("email");
  });

  it("warns on unusual service type", () => {
    const result = execute("v=DKIM1; s=ftp; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain(
      "Unusual service type: 'ftp' (expected: * or email)"
    );
  });

  it("truncates public key in output", () => {
    const longKey = "A".repeat(100);
    const result = execute(`v=DKIM1; p=${longKey}`);
    expect(result.tags.publicKey).toBe("AAAAAAAAAAAAAAAAAAAA...");
    expect(result.tags.publicKeyLength).toBe(100);
  });

  it("handles quoted DNS record format", () => {
    const result = execute('"v=DKIM1; k=rsa; " "p=MIGfMA0GCSqGSIb3DQEB"');
    expect(result.valid).toBe(true);
    expect(result.tags.keyType).toBe("rsa");
  });

  it("handles notes tag", () => {
    const result = execute("v=DKIM1; n=testing DKIM; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.valid).toBe(true);
    expect(result.tags.notes).toBe("testing DKIM");
  });

  it("throws on empty input", () => {
    expect(() => dkimValidator.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => dkimValidator.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });

  it("defaults key type to rsa when not specified", () => {
    const result = execute("v=DKIM1; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.tags.keyType).toBe("rsa");
  });

  it("defaults service type to * when not specified", () => {
    const result = execute("v=DKIM1; p=MIGfMA0GCSqGSIb3DQEB");
    expect(result.tags.serviceType).toBe("*");
  });

  it("includes rawTags in output", () => {
    const result = execute("v=DKIM1; k=rsa; p=abc");
    expect(result.rawTags).toEqual({ v: "DKIM1", k: "rsa", p: "abc" });
  });
});
