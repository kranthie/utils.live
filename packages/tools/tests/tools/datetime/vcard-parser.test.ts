import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { vcardParser } from "../../../src/tools/datetime/vcard-parser";

describe("vCard Parser", () => {
  it("should have correct metadata", () => {
    expect(vcardParser.meta.id).toBe("datetime/vcard-parser");
    expect(vcardParser.meta.category).toBe("datetime");
  });

  it("should parse a valid vCard", async () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:John Doe",
      "N:Doe;John;;;",
      "EMAIL;TYPE=INTERNET:john@example.com",
      "TEL;TYPE=CELL:+1234567890",
      "ORG:Acme Corp",
      "TITLE:Developer",
      "END:VCARD",
    ].join("\r\n");

    const result = await executeTool(vcardParser, { input: vcard });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const contacts = data.contacts as Array<Record<string, string>>;
      expect(contacts.length).toBe(1);
      expect(contacts[0]!.name).toBe("John Doe");
      expect(contacts[0]!.email).toBe("john@example.com");
      expect(contacts[0]!.phone).toBe("+1234567890");
      expect(contacts[0]!.organization).toBe("Acme Corp");
      expect(contacts[0]!.title).toBe("Developer");
    }
  });

  it("should parse multiple contacts", async () => {
    const vcard = [
      "BEGIN:VCARD",
      "FN:John Doe",
      "END:VCARD",
      "BEGIN:VCARD",
      "FN:Jane Smith",
      "END:VCARD",
    ].join("\r\n");

    const result = await executeTool(vcardParser, { input: vcard });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const contacts = data.contacts as Array<Record<string, string>>;
      expect(contacts.length).toBe(2);
    }
  });

  it("should handle vCard with N field but no FN", async () => {
    const vcard = [
      "BEGIN:VCARD",
      "N:Doe;John;;;",
      "END:VCARD",
    ].join("\r\n");

    const result = await executeTool(vcardParser, { input: vcard });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const contacts = data.contacts as Array<Record<string, string>>;
      expect(contacts[0]!.name).toBe("John Doe");
    }
  });

  it("should fail on empty input", async () => {
    const result = await executeTool(vcardParser, { input: "" });
    expect(result.success).toBe(false);
  });

  it("should fail on invalid format", async () => {
    const result = await executeTool(vcardParser, {
      input: "not a vcard",
    });
    expect(result.success).toBe(false);
  });

  it("should show unnamed for contact without name", async () => {
    const vcard = [
      "BEGIN:VCARD",
      "EMAIL:test@example.com",
      "END:VCARD",
    ].join("\r\n");

    const result = await executeTool(vcardParser, { input: vcard });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("(unnamed)");
    }
  });
});
