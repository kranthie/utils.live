import { describe, it, expect } from "vitest";
import { emailAddressParser } from "../../../src/tools/communication/email-address-parser";

interface ParsedEmail {
  name: string;
  email: string;
  local: string;
  domain: string;
  valid: boolean;
  original: string;
}

describe("email-address-parser", () => {
  const execute = (input: string): ParsedEmail[] => {
    const result = emailAddressParser.execute({ input }) as { output: string };
    return JSON.parse(result.output) as ParsedEmail[];
  };

  it("parses Name <email> format", () => {
    const results = execute("Jane Doe <jane.doe@example.com>");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Jane Doe");
    expect(results[0].email).toBe("jane.doe@example.com");
    expect(results[0].local).toBe("jane.doe");
    expect(results[0].domain).toBe("example.com");
    expect(results[0].valid).toBe(true);
  });

  it('parses "Name" <email> format', () => {
    const results = execute('"Support Team" <support@example.com>');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Support Team");
    expect(results[0].email).toBe("support@example.com");
    expect(results[0].valid).toBe(true);
  });

  it("parses email (Name) format", () => {
    const results = execute("admin@example.com (Site Admin)");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Site Admin");
    expect(results[0].email).toBe("admin@example.com");
    expect(results[0].valid).toBe(true);
  });

  it("parses plain email", () => {
    const results = execute("user@example.com");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("");
    expect(results[0].email).toBe("user@example.com");
    expect(results[0].local).toBe("user");
    expect(results[0].domain).toBe("example.com");
    expect(results[0].valid).toBe(true);
  });

  it("parses multiple emails separated by newlines", () => {
    const results = execute("a@example.com\nb@example.com");
    expect(results).toHaveLength(2);
  });

  it("parses comma-separated emails", () => {
    const results = execute("a@example.com, b@example.com");
    expect(results).toHaveLength(2);
  });

  it("parses semicolon-separated emails", () => {
    const results = execute("a@example.com; b@example.com");
    expect(results).toHaveLength(2);
  });

  it("marks invalid emails", () => {
    const results = execute("not-an-email");
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(false);
  });

  it("includes original field", () => {
    const results = execute("Jane <jane@example.com>");
    expect(results[0].original).toBe("Jane <jane@example.com>");
  });

  it("handles emails with plus addressing", () => {
    const results = execute("user+tag@example.com");
    expect(results).toHaveLength(1);
    expect(results[0].local).toBe("user+tag");
    expect(results[0].valid).toBe(true);
  });

  it("skips empty lines", () => {
    const results = execute("a@example.com\n\nb@example.com");
    expect(results).toHaveLength(2);
  });

  it("throws on empty input", () => {
    expect(() => emailAddressParser.execute({ input: "" })).toThrow(
      "Input cannot be empty"
    );
  });

  it("throws on whitespace-only input", () => {
    expect(() => emailAddressParser.execute({ input: "   " })).toThrow(
      "Input cannot be empty"
    );
  });
});
