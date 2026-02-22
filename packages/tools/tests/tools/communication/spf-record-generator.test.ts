import { describe, it, expect } from "vitest";
import { spfRecordGenerator } from "../../../src/tools/communication/spf-record-generator";

describe("spf-record-generator", () => {
  const execute = (input: Record<string, unknown> = {}): string =>
    (
      spfRecordGenerator.execute({
        domain: "example.com",
        includeGoogle: false,
        includeMicrosoft: false,
        includeMailgun: false,
        includeSendgrid: false,
        includeAmazonSes: false,
        policy: "~all" as const,
        ...input,
      }) as { output: string }
    ).output;

  it("generates basic SPF record", () => {
    const output = execute();
    expect(output).toContain("v=spf1 ~all");
    expect(output).toContain("DNS TXT Record for example.com:");
    expect(output).toContain("Name: example.com");
    expect(output).toContain("Type: TXT");
  });

  it("includes Google Workspace", () => {
    const output = execute({ includeGoogle: true });
    expect(output).toContain("include:_spf.google.com");
  });

  it("includes Microsoft 365", () => {
    const output = execute({ includeMicrosoft: true });
    expect(output).toContain("include:spf.protection.outlook.com");
  });

  it("includes Mailgun", () => {
    const output = execute({ includeMailgun: true });
    expect(output).toContain("include:mailgun.org");
  });

  it("includes SendGrid", () => {
    const output = execute({ includeSendgrid: true });
    expect(output).toContain("include:sendgrid.net");
  });

  it("includes Amazon SES", () => {
    const output = execute({ includeAmazonSes: true });
    expect(output).toContain("include:amazonses.com");
  });

  it("handles custom IPv4 addresses", () => {
    const output = execute({ customIps: "192.168.1.1, 10.0.0.1" });
    expect(output).toContain("ip4:192.168.1.1");
    expect(output).toContain("ip4:10.0.0.1");
  });

  it("handles custom IPv6 addresses", () => {
    const output = execute({ customIps: "2001:db8::1" });
    expect(output).toContain("ip6:2001:db8::1");
  });

  it("handles custom includes", () => {
    const output = execute({
      customIncludes: "spf.custom.com, mail.other.com",
    });
    expect(output).toContain("include:spf.custom.com");
    expect(output).toContain("include:mail.other.com");
  });

  it("uses -all (fail) policy", () => {
    const output = execute({ policy: "-all" });
    expect(output).toContain("-all");
    expect(output).toContain("fail");
    expect(output).toContain("should be rejected");
  });

  it("uses ?all (neutral) policy", () => {
    const output = execute({ policy: "?all" });
    expect(output).toContain("?all");
    expect(output).toContain("neutral");
  });

  it("uses +all (pass) policy with warning", () => {
    const output = execute({ policy: "+all" });
    expect(output).toContain("+all");
    expect(output).toContain("NOT recommended");
  });

  it("counts DNS lookups", () => {
    const output = execute({
      includeGoogle: true,
      includeMicrosoft: true,
    });
    expect(output).toContain("DNS lookup count: 2/10");
  });

  it("warns when exceeding 10 DNS lookups", () => {
    const output = execute({
      customIncludes:
        "a.com, b.com, c.com, d.com, e.com, f.com, g.com, h.com, i.com, j.com, k.com",
    });
    expect(output).toContain("WARNING: Exceeds 10 DNS lookup limit!");
  });

  it("uses custom domain name", () => {
    const output = execute({ domain: "mail.example.com" });
    expect(output).toContain("DNS TXT Record for mail.example.com:");
    expect(output).toContain("Name: mail.example.com");
  });
});
