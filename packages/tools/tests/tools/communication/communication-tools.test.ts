import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  emailHeaderParser,
  emailTemplateBuilder,
  emailToMarkdown,
  emailAddressParser,
  emailSignatureGenerator,
  spfRecordGenerator,
  dkimValidator,
  telegramFormatter,
  teamsFormatter,
  ircFormatter,
} from "../../../src/tools/communication";

// =====================================================
// Email Header Parser
// =====================================================
describe("Email Header Parser", () => {
  it("should have correct metadata", () => {
    expect(emailHeaderParser.meta.id).toBe("communication/email-header-parser");
    expect(emailHeaderParser.meta.category).toBe("communication");
  });

  it("should parse basic email headers", async () => {
    const headers =
      "From: sender@example.com\nTo: receiver@example.com\nSubject: Hello\nDate: Mon, 1 Jan 2024 00:00:00 +0000";
    const result = await executeTool(emailHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.summary.from).toBe("sender@example.com");
      expect(parsed.summary.to).toBe("receiver@example.com");
      expect(parsed.summary.subject).toBe("Hello");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(emailHeaderParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should handle multiline header values", async () => {
    const headers =
      "From: sender@example.com\nTo: receiver@example.com\nSubject: This is a long\n subject line";
    const result = await executeTool(emailHeaderParser, { input: headers });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>;
      expect(parsed.summary.subject).toContain("long");
    }
  });
});

// =====================================================
// Email Template Builder
// =====================================================
describe("Email Template Builder", () => {
  it("should have correct metadata", () => {
    expect(emailTemplateBuilder.meta.id).toBe(
      "communication/email-template-builder"
    );
    expect(emailTemplateBuilder.meta.category).toBe("communication");
  });

  it("should generate an HTML email template with defaults", async () => {
    const result = await executeTool(emailTemplateBuilder, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "<!DOCTYPE html>"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Welcome!"
      );
    }
  });

  it("should include CTA button when provided", async () => {
    const result = await executeTool(emailTemplateBuilder, {
      heading: "Test",
      body: "Hello",
      ctaText: "Click Here",
      ctaUrl: "https://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Click Here"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "https://example.com"
      );
    }
  });
});

// =====================================================
// MIME Type Lookup
// =====================================================
// =====================================================
// Email to Markdown
// =====================================================
describe("Email to Markdown", () => {
  it("should have correct metadata", () => {
    expect(emailToMarkdown.meta.id).toBe("communication/email-to-markdown");
    expect(emailToMarkdown.meta.category).toBe("communication");
  });

  it("should convert email to markdown", async () => {
    const email =
      "From: test@example.com\nSubject: Hello\n\nThis is the body of the email.";
    const result = await executeTool(emailToMarkdown, { input: email });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain("body");
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(emailToMarkdown, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Email Address Parser
// =====================================================
describe("Email Address Parser", () => {
  it("should have correct metadata", () => {
    expect(emailAddressParser.meta.id).toBe(
      "communication/email-address-parser"
    );
    expect(emailAddressParser.meta.category).toBe("communication");
  });

  it("should parse simple email address", async () => {
    const result = await executeTool(emailAddressParser, {
      input: "user@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>[];
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed[0].email).toBe("user@example.com");
    }
  });

  it("should parse email with display name", async () => {
    const result = await executeTool(emailAddressParser, {
      input: '"John Doe" <john@example.com>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const parsed = JSON.parse(
        String((result.data as Record<string, unknown>).output)
      ) as Record<string, unknown>[];
      expect(parsed[0].name).toBe("John Doe");
      expect(parsed[0].email).toBe("john@example.com");
    }
  });
});

// =====================================================
// Email Signature Generator
// =====================================================
describe("Email Signature Generator", () => {
  it("should have correct metadata", () => {
    expect(emailSignatureGenerator.meta.id).toBe(
      "communication/email-signature-generator"
    );
    expect(emailSignatureGenerator.meta.category).toBe("communication");
  });

  it("should generate signature with defaults", async () => {
    const result = await executeTool(emailSignatureGenerator, {});
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "John Doe"
      );
      expect((result.data as Record<string, unknown>).output).toContain(
        "Software Engineer"
      );
    }
  });

  it("should generate signature with custom data", async () => {
    const result = await executeTool(emailSignatureGenerator, {
      name: "Jane Smith",
      title: "CTO",
      company: "TechCo",
      email: "jane@techco.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "Jane Smith"
      );
      expect((result.data as Record<string, unknown>).output).toContain("CTO");
    }
  });
});

// =====================================================
// SPF Record Generator
// =====================================================
describe("SPF Record Generator", () => {
  it("should have correct metadata", () => {
    expect(spfRecordGenerator.meta.id).toBe(
      "communication/spf-record-generator"
    );
    expect(spfRecordGenerator.meta.category).toBe("communication");
  });

  it("should generate basic SPF record", async () => {
    const result = await executeTool(spfRecordGenerator, {
      domain: "example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "v=spf1"
      );
      expect((result.data as Record<string, unknown>).output).toContain("~all");
    }
  });

  it("should include Google when enabled", async () => {
    const result = await executeTool(spfRecordGenerator, {
      domain: "example.com",
      includeGoogle: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toContain(
        "_spf.google.com"
      );
    }
  });
});

// =====================================================
// DKIM Validator
// =====================================================
describe("DKIM Validator", () => {
  it("should have correct metadata", () => {
    expect(dkimValidator.meta.id).toBe("communication/dkim-validator");
    expect(dkimValidator.meta.category).toBe("communication");
  });

  it("should validate a DKIM record", async () => {
    const dkim = "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3";
    const result = await executeTool(dkimValidator, { input: dkim });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(dkimValidator, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Telegram Formatter
// =====================================================
describe("Telegram Formatter", () => {
  it("should have correct metadata", () => {
    expect(telegramFormatter.meta.id).toBe("communication/telegram-formatter");
    expect(telegramFormatter.meta.category).toBe("communication");
  });

  it("should format text for Telegram", async () => {
    const result = await executeTool(telegramFormatter, {
      input: "**bold** and _italic_",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(telegramFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// Teams Formatter
// =====================================================
describe("Teams Formatter", () => {
  it("should have correct metadata", () => {
    expect(teamsFormatter.meta.id).toBe("communication/teams-formatter");
    expect(teamsFormatter.meta.category).toBe("communication");
  });

  it("should format text for Teams", async () => {
    const result = await executeTool(teamsFormatter, {
      input: "Hello **world**",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(teamsFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});

// =====================================================
// IRC Formatter
// =====================================================
describe("IRC Formatter", () => {
  it("should have correct metadata", () => {
    expect(ircFormatter.meta.id).toBe("communication/irc-formatter");
    expect(ircFormatter.meta.category).toBe("communication");
  });

  it("should format text with IRC color codes", async () => {
    const result = await executeTool(ircFormatter, { input: "Hello world" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).output).toBeDefined();
    }
  });

  it("should throw on empty input", async () => {
    const result = await executeTool(ircFormatter, { input: "" });
    expect(result.success).toBe(false);
  });
});
