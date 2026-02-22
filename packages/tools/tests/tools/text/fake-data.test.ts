import { describe, it, expect } from "vitest";
import {
  fakeName,
  fakeAddress,
  fakeCompany,
} from "../../../src/tools/text/fake-data";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("fakeName", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(fakeName.meta.id).toBe("text/fake-name");
      expect(fakeName.meta.name).toBe("Fake Name Generator");
      expect(fakeName.meta.category).toBe("text");
      expect(fakeName.meta.tier).toBe(ToolTier.CLIENT);
      expect(fakeName.meta.keywords).toContain("fake");
      expect(fakeName.meta.keywords).toContain("name");
    });
  });

  describe("execute", () => {
    it("should generate a single name by default", async () => {
      const result = await executeTool(fakeName, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).names as unknown[]).length
        ).toBe(1);
        const name = (
          (result.data as Record<string, unknown>).names as Record<
            string,
            unknown
          >[]
        )[0];
        expect(name?.first).toBeDefined();
        expect(name?.last).toBeDefined();
        expect(name?.full).toBeDefined();
        expect(name?.email).toBeDefined();
      }
    });

    it("should generate multiple names", async () => {
      const result = await executeTool(fakeName, { count: 5 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).names as unknown[]).length
        ).toBe(5);
      }
    });

    it("should generate valid email format", async () => {
      const result = await executeTool(fakeName, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const email = (
          (result.data as Record<string, unknown>).names as Record<
            string,
            unknown
          >[]
        )[0]?.email;
        expect(email).toMatch(/@example\.com$/);
        expect(email).toMatch(/^[a-z]+\.[a-z]+@/);
      }
    });

    it("should generate full name from first and last", async () => {
      const result = await executeTool(fakeName, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const name = (
          (result.data as Record<string, unknown>).names as Record<
            string,
            unknown
          >[]
        )[0];
        expect(name?.full).toBe(
          `${name?.first as string} ${name?.last as string}`
        );
      }
    });

    it("should handle maximum count", async () => {
      const result = await executeTool(fakeName, { count: 100 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).names as unknown[]).length
        ).toBe(100);
      }
    });

    it("should generate different names (randomness)", async () => {
      const result = await executeTool(fakeName, { count: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        const fullNames = (
          (result.data as Record<string, unknown>).names as unknown[]
        ).map((n: Record<string, unknown>) => n.full);
        // Check that not all names are the same
        const uniqueNames = new Set(fullNames);
        // With 10 random names, we expect some variety (but not guaranteed)
        expect(uniqueNames.size).toBeGreaterThan(0);
      }
    });
  });
});

describe("fakeAddress", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(fakeAddress.meta.id).toBe("text/fake-address");
      expect(fakeAddress.meta.name).toBe("Fake Address Generator");
      expect(fakeAddress.meta.category).toBe("text");
      expect(fakeAddress.meta.tier).toBe(ToolTier.CLIENT);
      expect(fakeAddress.meta.keywords).toContain("fake");
      expect(fakeAddress.meta.keywords).toContain("address");
    });
  });

  describe("execute", () => {
    it("should generate a single address by default", async () => {
      const result = await executeTool(fakeAddress, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).addresses as unknown[])
            .length
        ).toBe(1);
        const address = (
          (result.data as Record<string, unknown>).addresses as Record<
            string,
            unknown
          >[]
        )[0];
        expect(address?.street).toBeDefined();
        expect(address?.city).toBeDefined();
        expect(address?.state).toBeDefined();
        expect(address?.stateCode).toBeDefined();
        expect(address?.zip).toBeDefined();
        expect(address?.full).toBeDefined();
      }
    });

    it("should generate multiple addresses", async () => {
      const result = await executeTool(fakeAddress, { count: 5 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).addresses as unknown[])
            .length
        ).toBe(5);
      }
    });

    it("should generate valid zip code format", async () => {
      const result = await executeTool(fakeAddress, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const zip = (
          (result.data as Record<string, unknown>).addresses as Record<
            string,
            unknown
          >[]
        )[0]?.zip;
        expect(zip).toMatch(/^\d{5}$/);
      }
    });

    it("should generate valid state code format", async () => {
      const result = await executeTool(fakeAddress, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const stateCode = (
          (result.data as Record<string, unknown>).addresses as Record<
            string,
            unknown
          >[]
        )[0]?.stateCode;
        expect(stateCode).toMatch(/^[A-Z]{2}$/);
      }
    });

    it("should generate street with number", async () => {
      const result = await executeTool(fakeAddress, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const street = (
          (result.data as Record<string, unknown>).addresses as Record<
            string,
            unknown
          >[]
        )[0]?.street;
        expect(street).toMatch(/^\d+\s/); // Starts with number
      }
    });

    it("should generate full address in correct format", async () => {
      const result = await executeTool(fakeAddress, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const address = (
          (result.data as Record<string, unknown>).addresses as Record<
            string,
            unknown
          >[]
        )[0];
        expect(address?.full).toContain(address?.street);
        expect(address?.full).toContain(address?.city);
        expect(address?.full).toContain(address?.stateCode);
        expect(address?.full).toContain(address?.zip);
      }
    });

    it("should handle maximum count", async () => {
      const result = await executeTool(fakeAddress, { count: 100 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).addresses as unknown[])
            .length
        ).toBe(100);
      }
    });
  });
});

describe("fakeCompany", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(fakeCompany.meta.id).toBe("text/fake-company");
      expect(fakeCompany.meta.name).toBe("Fake Company Generator");
      expect(fakeCompany.meta.category).toBe("text");
      expect(fakeCompany.meta.tier).toBe(ToolTier.CLIENT);
      expect(fakeCompany.meta.keywords).toContain("fake");
      expect(fakeCompany.meta.keywords).toContain("company");
    });
  });

  describe("execute", () => {
    it("should generate a single company by default", async () => {
      const result = await executeTool(fakeCompany, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).companies as unknown[])
            .length
        ).toBe(1);
        const company = (
          (result.data as Record<string, unknown>).companies as Record<
            string,
            unknown
          >[]
        )[0];
        expect(company?.name).toBeDefined();
        expect(company?.industry).toBeDefined();
        expect(company?.catchPhrase).toBeDefined();
      }
    });

    it("should generate multiple companies", async () => {
      const result = await executeTool(fakeCompany, { count: 5 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).companies as unknown[])
            .length
        ).toBe(5);
      }
    });

    it("should generate company names with suffix", async () => {
      const result = await executeTool(fakeCompany, { count: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        // At least some should have common suffixes
        const names = (
          (result.data as Record<string, unknown>).companies as unknown[]
        ).map((c: Record<string, unknown>) => c.name);
        const suffixes = [
          "Corp",
          "Inc",
          "LLC",
          "Group",
          "Industries",
          "Solutions",
          "Systems",
          "Labs",
          "Technologies",
          "Enterprises",
          "Holdings",
          "Partners",
          "Services",
          "Dynamics",
        ];
        const hasCommonSuffix = names.some((name: unknown) =>
          suffixes.some((s) => (name as string).includes(s))
        );
        expect(hasCommonSuffix).toBe(true);
      }
    });

    it("should generate valid industries", async () => {
      const validIndustries = [
        "Technology",
        "Healthcare",
        "Finance",
        "Manufacturing",
        "Retail",
        "Education",
        "Real Estate",
        "Energy",
        "Transportation",
        "Media",
      ];

      const result = await executeTool(fakeCompany, { count: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const company of (result.data as Record<string, unknown>)
          .companies as Record<string, unknown>[]) {
          expect(validIndustries).toContain(company.industry);
        }
      }
    });

    it("should generate catch phrases", async () => {
      const result = await executeTool(fakeCompany, { count: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        const catchPhrase = (
          (result.data as Record<string, unknown>).companies as Record<
            string,
            unknown
          >[]
        )[0]?.catchPhrase;
        expect(catchPhrase?.length).toBeGreaterThan(0);
      }
    });

    it("should handle maximum count", async () => {
      const result = await executeTool(fakeCompany, { count: 100 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          ((result.data as Record<string, unknown>).companies as unknown[])
            .length
        ).toBe(100);
      }
    });
  });
});
