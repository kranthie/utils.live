import { describe, it, expect } from "vitest";
import { emailSignatureGenerator } from "../../../src/tools/communication/email-signature-generator";

describe("email-signature-generator", () => {
  const execute = (input: Record<string, unknown> = {}): string =>
    (
      emailSignatureGenerator.execute({
        name: "John Doe",
        title: "Software Engineer",
        company: "Acme Inc.",
        email: "john@example.com",
        style: "professional" as const,
        ...input,
      }) as { output: string }
    ).output;

  it("generates professional style by default", () => {
    const html = execute();
    expect(html).toContain("John Doe");
    expect(html).toContain("Software Engineer");
    expect(html).toContain("Acme Inc.");
    expect(html).toContain("john@example.com");
    expect(html).toContain("<table");
    expect(html).toContain("border-right: 2px solid #007bff");
  });

  it("generates minimal style", () => {
    const html = execute({ style: "minimal" });
    expect(html).toContain("John Doe");
    expect(html).toContain("<strong>");
    expect(html).not.toContain("<table");
  });

  it("generates creative style", () => {
    const html = execute({ style: "creative" });
    expect(html).toContain("John Doe");
    expect(html).toContain("border-left: 4px solid #e74c3c");
    expect(html).toContain("text-transform: uppercase");
  });

  it("includes phone when provided", () => {
    const html = execute({ phone: "+1 555-1234" });
    expect(html).toContain("+1 555-1234");
  });

  it("includes website when provided", () => {
    const html = execute({ website: "https://example.com" });
    expect(html).toContain("https://example.com");
  });

  it("includes LinkedIn link for professional style", () => {
    const html = execute({
      linkedin: "https://linkedin.com/in/johndoe",
    });
    expect(html).toContain("LinkedIn");
    expect(html).toContain("https://linkedin.com/in/johndoe");
  });

  it("includes Twitter link for professional style", () => {
    const html = execute({ twitter: "@johndoe" });
    expect(html).toContain("Twitter");
    expect(html).toContain("https://twitter.com/johndoe");
  });

  it("escapes HTML in inputs", () => {
    const html = execute({ name: '<script>alert("xss")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes phone in minimal style", () => {
    const html = execute({ style: "minimal", phone: "+1 555-9999" });
    expect(html).toContain("+1 555-9999");
  });

  it("includes website and social links in creative style", () => {
    const html = execute({
      style: "creative",
      website: "https://example.com",
      linkedin: "https://linkedin.com/in/test",
      twitter: "@test",
    });
    expect(html).toContain("Website");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Twitter");
  });

  it("omits social section when no social links", () => {
    const html = execute();
    expect(html).not.toContain("LinkedIn");
    expect(html).not.toContain("Twitter");
  });
});
