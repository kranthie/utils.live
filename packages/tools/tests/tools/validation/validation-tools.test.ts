import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import {
  emailValidator,
  urlValidator,
  phoneValidator,
  uuidValidator,
  macAddressValidator,
  ipv4Validator,
  ipv6Validator,
  domainValidator,
  hostnameValidator,
  slugValidator,
  semverValidator,
  hexColorValidator,
  creditCardValidator,
  isbnValidator,
  issnValidator,
  doiValidator,
  javascriptValidator,
  sqlValidator,
  cronValidatorTool,
} from "../../../src/tools/validation";
import { jsonValidator } from "../../../src/tools/validation/json-validator";
import { xmlValidator } from "../../../src/tools/validation/xml-validator";
import { yamlValidator } from "../../../src/tools/validation/yaml-validator";
import { tomlValidator } from "../../../src/tools/validation/toml-validator";
import { csvValidator } from "../../../src/tools/validation/csv-validator";
import { htmlValidator } from "../../../src/tools/validation/html-validator";
import { cssValidator } from "../../../src/tools/validation/css-validator";

// ─── Format Validators ──────────────────────────────────────────────

describe("Email Validator", () => {
  it("should have correct metadata", () => {
    expect(emailValidator.meta.id).toBe("validation/email-validator");
    expect(emailValidator.meta.category).toBe("validation");
  });

  it("should validate a correct email", async () => {
    const result = await executeTool(emailValidator, {
      input: "user@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
      expect((result.data as Record<string, unknown>).output).toContain(
        "Valid"
      );
    }
  });

  it("should reject email without @", async () => {
    const result = await executeTool(emailValidator, {
      input: "userexample.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject email without domain", async () => {
    const result = await executeTool(emailValidator, { input: "user@" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject empty email", async () => {
    const result = await executeTool(emailValidator, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("URL Validator", () => {
  it("should have correct metadata", () => {
    expect(urlValidator.meta.id).toBe("validation/url-validator");
    expect(urlValidator.meta.category).toBe("validation");
  });

  it("should validate a correct HTTPS URL", async () => {
    const result = await executeTool(urlValidator, {
      input: "https://example.com/path?q=1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate HTTP URL", async () => {
    const result = await executeTool(urlValidator, {
      input: "http://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid URL", async () => {
    const result = await executeTool(urlValidator, { input: "not a url" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Phone Validator", () => {
  it("should have correct metadata", () => {
    expect(phoneValidator.meta.id).toBe("validation/phone-validator");
    expect(phoneValidator.meta.category).toBe("validation");
  });

  it("should validate a valid phone number", async () => {
    const result = await executeTool(phoneValidator, { input: "+1234567890" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject obviously invalid phone", async () => {
    const result = await executeTool(phoneValidator, { input: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("UUID Validator", () => {
  it("should have correct metadata", () => {
    expect(uuidValidator.meta.id).toBe("validation/uuid-validator");
    expect(uuidValidator.meta.category).toBe("validation");
  });

  it("should validate a valid UUID v4", async () => {
    const result = await executeTool(uuidValidator, {
      input: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid UUID", async () => {
    const result = await executeTool(uuidValidator, { input: "not-a-uuid" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(uuidValidator, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("MAC Address Validator", () => {
  it("should have correct metadata", () => {
    expect(macAddressValidator.meta.id).toBe(
      "validation/mac-address-validator"
    );
    expect(macAddressValidator.meta.category).toBe("validation");
  });

  it("should validate valid MAC with colons", async () => {
    const result = await executeTool(macAddressValidator, {
      input: "00:1B:44:11:3A:B7",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate valid MAC with dashes", async () => {
    const result = await executeTool(macAddressValidator, {
      input: "00-1B-44-11-3A-B7",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid MAC", async () => {
    const result = await executeTool(macAddressValidator, {
      input: "ZZ:ZZ:ZZ:ZZ:ZZ:ZZ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("IPv4 Validator", () => {
  it("should have correct metadata", () => {
    expect(ipv4Validator.meta.id).toBe("validation/ipv4-validator");
    expect(ipv4Validator.meta.category).toBe("validation");
  });

  it("should validate valid IPv4", async () => {
    const result = await executeTool(ipv4Validator, { input: "192.168.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate localhost", async () => {
    const result = await executeTool(ipv4Validator, { input: "127.0.0.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid IPv4 (octet > 255)", async () => {
    const result = await executeTool(ipv4Validator, { input: "256.1.1.1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject non-IP text", async () => {
    const result = await executeTool(ipv4Validator, { input: "hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("IPv6 Validator", () => {
  it("should have correct metadata", () => {
    expect(ipv6Validator.meta.id).toBe("validation/ipv6-validator");
    expect(ipv6Validator.meta.category).toBe("validation");
  });

  it("should validate valid IPv6", async () => {
    const result = await executeTool(ipv6Validator, {
      input: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate compressed IPv6", async () => {
    const result = await executeTool(ipv6Validator, { input: "::1" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid IPv6", async () => {
    const result = await executeTool(ipv6Validator, { input: "not-an-ipv6" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Domain Validator", () => {
  it("should have correct metadata", () => {
    expect(domainValidator.meta.id).toBe("validation/domain-validator");
    expect(domainValidator.meta.category).toBe("validation");
  });

  it("should validate valid domain", async () => {
    const result = await executeTool(domainValidator, { input: "example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate subdomain", async () => {
    const result = await executeTool(domainValidator, {
      input: "sub.example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid domain", async () => {
    const result = await executeTool(domainValidator, {
      input: "-invalid.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Hostname Validator", () => {
  it("should have correct metadata", () => {
    expect(hostnameValidator.meta.id).toBe("validation/hostname-validator");
    expect(hostnameValidator.meta.category).toBe("validation");
  });

  it("should validate valid hostname", async () => {
    const result = await executeTool(hostnameValidator, {
      input: "my-server-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject hostname starting with hyphen", async () => {
    const result = await executeTool(hostnameValidator, { input: "-invalid" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Slug Validator", () => {
  it("should have correct metadata", () => {
    expect(slugValidator.meta.id).toBe("validation/slug-validator");
    expect(slugValidator.meta.category).toBe("validation");
  });

  it("should validate valid slug", async () => {
    const result = await executeTool(slugValidator, { input: "my-blog-post" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject slug with spaces", async () => {
    const result = await executeTool(slugValidator, { input: "not a slug" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject slug with uppercase", async () => {
    const result = await executeTool(slugValidator, { input: "Not-Valid" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Semver Validator", () => {
  it("should have correct metadata", () => {
    expect(semverValidator.meta.id).toBe("validation/semver-validator");
    expect(semverValidator.meta.category).toBe("validation");
  });

  it("should validate valid semver", async () => {
    const result = await executeTool(semverValidator, { input: "1.2.3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate semver with prerelease", async () => {
    const result = await executeTool(semverValidator, {
      input: "1.0.0-beta.1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid semver", async () => {
    const result = await executeTool(semverValidator, { input: "1.2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Hex Color Validator", () => {
  it("should have correct metadata", () => {
    expect(hexColorValidator.meta.id).toBe("validation/hex-color-validator");
    expect(hexColorValidator.meta.category).toBe("validation");
  });

  it("should validate 6-digit hex color", async () => {
    const result = await executeTool(hexColorValidator, { input: "#ff5733" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate 3-digit hex color", async () => {
    const result = await executeTool(hexColorValidator, { input: "#f00" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid hex color", async () => {
    const result = await executeTool(hexColorValidator, { input: "#xyz" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Credit Card Validator", () => {
  it("should have correct metadata", () => {
    expect(creditCardValidator.meta.id).toBe(
      "validation/credit-card-validator"
    );
    expect(creditCardValidator.meta.category).toBe("validation");
  });

  it("should validate a valid card number (Luhn check)", async () => {
    // 4111111111111111 is a known Luhn-valid Visa test number
    const result = await executeTool(creditCardValidator, {
      input: "4111111111111111",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
      expect((result.data as Record<string, unknown>).output).toContain("Visa");
    }
  });

  it("should handle card number with spaces", async () => {
    const result = await executeTool(creditCardValidator, {
      input: "4111 1111 1111 1111",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid card number", async () => {
    const result = await executeTool(creditCardValidator, {
      input: "1234567890123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject non-numeric input", async () => {
    const result = await executeTool(creditCardValidator, {
      input: "abcd-efgh-ijkl-mnop",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("ISBN Validator", () => {
  it("should have correct metadata", () => {
    expect(isbnValidator.meta.id).toBe("validation/isbn-validator");
    expect(isbnValidator.meta.category).toBe("validation");
  });

  it("should validate a valid ISBN-13", async () => {
    const result = await executeTool(isbnValidator, {
      input: "978-0-306-40615-7",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid ISBN", async () => {
    const result = await executeTool(isbnValidator, { input: "123-456" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("ISSN Validator", () => {
  it("should have correct metadata", () => {
    expect(issnValidator.meta.id).toBe("validation/issn-validator");
    expect(issnValidator.meta.category).toBe("validation");
  });

  it("should validate a valid ISSN", async () => {
    const result = await executeTool(issnValidator, { input: "0378-5955" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid ISSN", async () => {
    const result = await executeTool(issnValidator, { input: "1234" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("DOI Validator", () => {
  it("should have correct metadata", () => {
    expect(doiValidator.meta.id).toBe("validation/doi-validator");
    expect(doiValidator.meta.category).toBe("validation");
  });

  it("should validate a valid DOI", async () => {
    const result = await executeTool(doiValidator, { input: "10.1000/xyz123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid DOI", async () => {
    const result = await executeTool(doiValidator, { input: "not-a-doi" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

// ─── Data Validators ────────────────────────────────────────────────

describe("JSON Validator", () => {
  it("should have correct metadata", () => {
    expect(jsonValidator.meta.id).toBe("validation/json-validator");
    expect(jsonValidator.meta.category).toBe("validation");
  });

  it("should validate valid JSON object", async () => {
    const result = await executeTool(jsonValidator, {
      input: '{"key": "value"}',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate valid JSON array", async () => {
    const result = await executeTool(jsonValidator, { input: "[1, 2, 3]" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid JSON", async () => {
    const result = await executeTool(jsonValidator, {
      input: "{invalid json}",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
      expect((result.data as Record<string, unknown>).errors).toBeDefined();
    }
  });
});

describe("XML Validator", () => {
  it("should have correct metadata", () => {
    expect(xmlValidator.meta.id).toBe("validation/xml-validator");
    expect(xmlValidator.meta.category).toBe("validation");
  });

  it("should validate well-formed XML", async () => {
    const result = await executeTool(xmlValidator, {
      input: '<?xml version="1.0"?><root><child>text</child></root>',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject malformed XML (unclosed tag)", async () => {
    const result = await executeTool(xmlValidator, {
      input: "<root><child>text</root>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(xmlValidator, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("YAML Validator", () => {
  it("should have correct metadata", () => {
    expect(yamlValidator.meta.id).toBe("validation/yaml-validator");
    expect(yamlValidator.meta.category).toBe("validation");
  });

  it("should validate valid YAML", async () => {
    const result = await executeTool(yamlValidator, {
      input: "name: test\nversion: 1.0\nlist:\n  - item1\n  - item2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject YAML with tab indentation", async () => {
    const result = await executeTool(yamlValidator, {
      input: "name:\n\t- bad",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("TOML Validator", () => {
  it("should have correct metadata", () => {
    expect(tomlValidator.meta.id).toBe("validation/toml-validator");
    expect(tomlValidator.meta.category).toBe("validation");
  });

  it("should validate valid TOML", async () => {
    const result = await executeTool(tomlValidator, {
      input: '[package]\nname = "test"\nversion = "1.0.0"',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should accept empty input as valid empty document", async () => {
    const result = await executeTool(tomlValidator, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
      expect((result.data as Record<string, unknown>).output).toContain(
        "Empty"
      );
    }
  });

  it("should reject invalid TOML content", async () => {
    const result = await executeTool(tomlValidator, {
      input: "not valid toml content",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("CSV Validator", () => {
  it("should have correct metadata", () => {
    expect(csvValidator.meta.id).toBe("validation/csv-validator");
    expect(csvValidator.meta.category).toBe("validation");
  });

  it("should validate valid CSV", async () => {
    const result = await executeTool(csvValidator, {
      input: "name,age,city\nAlice,30,NYC\nBob,25,LA",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should detect inconsistent column counts", async () => {
    const result = await executeTool(csvValidator, {
      input: "a,b,c\n1,2\n3,4,5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("HTML Validator", () => {
  it("should have correct metadata", () => {
    expect(htmlValidator.meta.id).toBe("validation/html-validator");
    expect(htmlValidator.meta.category).toBe("validation");
  });

  it("should validate well-formed HTML", async () => {
    const result = await executeTool(htmlValidator, {
      input:
        "<html><head><title>Test</title></head><body><p>Hello</p></body></html>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should accept self-closing void elements", async () => {
    const result = await executeTool(htmlValidator, {
      input: "<div><br><img src='test.png'><hr></div>",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject unclosed tags", async () => {
    const result = await executeTool(htmlValidator, {
      input: "<div><p>Unclosed div",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("CSS Validator", () => {
  it("should have correct metadata", () => {
    expect(cssValidator.meta.id).toBe("validation/css-validator");
    expect(cssValidator.meta.category).toBe("validation");
  });

  it("should validate valid CSS", async () => {
    const result = await executeTool(cssValidator, {
      input: "body { color: red; font-size: 14px; }\n.class { margin: 0; }",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should detect unmatched braces", async () => {
    const result = await executeTool(cssValidator, {
      input: "body { color: red;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("JavaScript Validator", () => {
  it("should have correct metadata", () => {
    expect(javascriptValidator.meta.id).toBe("validation/javascript-validator");
    expect(javascriptValidator.meta.category).toBe("validation");
  });

  it("should validate valid JavaScript", async () => {
    const result = await executeTool(javascriptValidator, {
      input: 'const x = 1;\nfunction greet(name) { return "Hello " + name; }',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject invalid JavaScript", async () => {
    const result = await executeTool(javascriptValidator, {
      input: "function { broken",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("SQL Validator", () => {
  it("should have correct metadata", () => {
    expect(sqlValidator.meta.id).toBe("validation/sql-validator");
    expect(sqlValidator.meta.category).toBe("validation");
  });

  it("should validate valid SELECT query", async () => {
    const result = await executeTool(sqlValidator, {
      input: "SELECT id, name FROM users WHERE age > 18 ORDER BY name;",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate valid INSERT query", async () => {
    const result = await executeTool(sqlValidator, {
      input: "INSERT INTO users (name, age) VALUES ('Alice', 30);",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject empty input", async () => {
    const result = await executeTool(sqlValidator, { input: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});

describe("Cron Validator", () => {
  it("should have correct metadata", () => {
    expect(cronValidatorTool.meta.id).toBe("validation/cron-validator-tool");
    expect(cronValidatorTool.meta.category).toBe("validation");
  });

  it("should validate standard 5-field cron", async () => {
    const result = await executeTool(cronValidatorTool, {
      input: "*/5 * * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
      expect((result.data as Record<string, unknown>).output).toContain(
        "Valid cron"
      );
    }
  });

  it("should validate complex cron expression", async () => {
    const result = await executeTool(cronValidatorTool, {
      input: "0 9 1-15 1,6 1-5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should validate 6-field cron (with seconds)", async () => {
    const result = await executeTool(cronValidatorTool, {
      input: "0 */5 * * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(true);
    }
  });

  it("should reject cron with wrong field count", async () => {
    const result = await executeTool(cronValidatorTool, { input: "* * *" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });

  it("should reject cron with out-of-range values", async () => {
    const result = await executeTool(cronValidatorTool, {
      input: "60 * * * *",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).isValid).toBe(false);
    }
  });
});
