import { describe, it, expect } from "vitest";
import { executeTool } from "../../../src/core/executor";
import { vcardGenerator } from "../../../src/tools/datetime/vcard-generator";

describe("vCard Generator", () => {
  it("should have correct metadata", () => {
    expect(vcardGenerator.meta.id).toBe("datetime/vcard-generator");
    expect(vcardGenerator.meta.category).toBe("datetime");
  });

  it("should generate a basic vCard", async () => {
    const result = await executeTool(vcardGenerator, {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      organization: "",
      title: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      website: "",
      note: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("BEGIN:VCARD");
      expect(output).toContain("END:VCARD");
      expect(output).toContain("VERSION:3.0");
      expect(output).toContain("FN:John Doe");
      expect(output).toContain("N:Doe;John;;;");
      expect(output).toContain("EMAIL;TYPE=INTERNET:john@example.com");
      expect(output).toContain("TEL;TYPE=CELL:+1234567890");
    }
  });

  it("should generate vCard with all fields", async () => {
    const result = await executeTool(vcardGenerator, {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "+0987654321",
      organization: "Acme Corp",
      title: "CEO",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
      website: "https://example.com",
      note: "Important contact",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).toContain("ORG:Acme Corp");
      expect(output).toContain("TITLE:CEO");
      expect(output).toContain("ADR;TYPE=HOME:");
      expect(output).toContain("URL:https://example.com");
      expect(output).toContain("NOTE:Important contact");
    }
  });

  it("should omit empty optional fields", async () => {
    const result = await executeTool(vcardGenerator, {
      firstName: "Test",
      lastName: "User",
      email: "",
      phone: "",
      organization: "",
      title: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      website: "",
      note: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      const output = data.output as string;
      expect(output).not.toContain("EMAIL");
      expect(output).not.toContain("TEL");
      expect(output).not.toContain("ORG");
      expect(output).not.toContain("TITLE");
      expect(output).not.toContain("URL");
      expect(output).not.toContain("NOTE");
    }
  });

  it("should include REV timestamp", async () => {
    const result = await executeTool(vcardGenerator, {
      firstName: "Test",
      lastName: "User",
      email: "",
      phone: "",
      organization: "",
      title: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      website: "",
      note: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const data = result.data as Record<string, unknown>;
      expect((data.output as string)).toContain("REV:");
    }
  });
});
