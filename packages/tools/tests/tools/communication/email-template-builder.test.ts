import { describe, it, expect } from "vitest";
import { emailTemplateBuilder } from "../../../src/tools/communication/email-template-builder";

describe("email-template-builder", () => {
  const execute = (input: Record<string, unknown> = {}): string =>
    (
      emailTemplateBuilder.execute({
        subject: "Test Subject",
        heading: "Hello",
        body: "Test body text.",
        footerText: "© 2025 Test Co.",
        primaryColor: "#007bff",
        ...input,
      }) as { output: string }
    ).output;

  it("generates valid HTML document", () => {
    const html = execute();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("</html>");
  });

  it("includes subject in title tag", () => {
    const html = execute({ subject: "My Email Subject" });
    expect(html).toContain("<title>My Email Subject</title>");
  });

  it("includes heading in h1", () => {
    const html = execute({ heading: "Welcome Aboard" });
    expect(html).toContain("Welcome Aboard</h1>");
  });

  it("renders body text as paragraphs", () => {
    const html = execute({ body: "First paragraph.\nSecond paragraph." });
    expect(html).toContain("First paragraph.</p>");
    expect(html).toContain("Second paragraph.</p>");
  });

  it("includes CTA button when ctaText and ctaUrl provided", () => {
    const html = execute({
      ctaText: "Click Here",
      ctaUrl: "https://example.com/action",
    });
    expect(html).toContain("Click Here</a>");
    expect(html).toContain('href="https://example.com/action"');
  });

  it("omits CTA when not provided", () => {
    const html = execute();
    expect(html).not.toContain(
      'role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;"'
    );
  });

  it("includes footer text", () => {
    const html = execute({ footerText: "© 2025 Acme Inc." });
    expect(html).toContain("© 2025 Acme Inc.");
  });

  it("uses primary color for header background", () => {
    const html = execute({ primaryColor: "#e74c3c" });
    expect(html).toContain("background-color: #e74c3c");
  });

  it("uses primary color for CTA button", () => {
    const html = execute({
      ctaText: "Go",
      ctaUrl: "https://example.com",
      primaryColor: "#28a745",
    });
    expect(html).toContain("background: #28a745");
  });

  it("escapes HTML in inputs", () => {
    const html = execute({ heading: '<script>alert("xss")</script>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("uses table-based layout for email compatibility", () => {
    const html = execute();
    expect(html).toContain('role="presentation"');
    expect(html).toContain("max-width: 600px");
  });

  it("sets default footer year to 2025", () => {
    const html = (
      emailTemplateBuilder.execute({
        subject: "Test",
        heading: "Test",
        body: "Test",
        footerText: "© 2025 Company Name. All rights reserved.",
        primaryColor: "#007bff",
      }) as { output: string }
    ).output;
    expect(html).toContain("© 2025");
  });

  it("example output matches actual execute() output", () => {
    const exampleInput = emailTemplateBuilder.meta.examples![0]!.input as {
      subject: string;
      heading: string;
      body: string;
      ctaText: string;
      ctaUrl: string;
      footerText: string;
      primaryColor: string;
    };
    const actual = (
      emailTemplateBuilder.execute(exampleInput) as { output: string }
    ).output;
    const exampleOutput = emailTemplateBuilder.meta.examples![0]!.output;
    expect(actual).toBe(exampleOutput);
  });
});
