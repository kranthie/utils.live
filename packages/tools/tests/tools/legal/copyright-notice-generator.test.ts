import { describe, it, expect } from "vitest";
import { copyrightNoticeGenerator } from "../../../src/tools/legal/copyright-notice-generator";
import { executeTool } from "../../../src/core/executor";

describe("copyrightNoticeGenerator", () => {
  describe("meta", () => {
    it("should have correct metadata", () => {
      expect(copyrightNoticeGenerator.meta.id).toBe(
        "legal/copyright-notice-generator"
      );
      expect(copyrightNoticeGenerator.meta.category).toBe("legal");
    });
  });

  describe("execute", () => {
    it("should generate standard copyright notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "standard",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Copyright");
        expect(output).toContain("2025");
        expect(output).toContain("Company Name");
        expect(output).toContain("All rights reserved");
      }
    });

    it("should generate MIT license notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "mit",
        holder: "John Doe",
        year: "2024",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("MIT License");
        expect(output).toContain("John Doe");
        expect(output).toContain("Permission is hereby granted");
      }
    });

    it("should generate Apache license notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "apache",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Apache License, Version 2.0");
        expect(output).toContain("http://www.apache.org/licenses/LICENSE-2.0");
      }
    });

    it("should generate Creative Commons notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "creative-commons",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("Creative Commons Attribution 4.0");
        expect(output).toContain("creativecommons.org");
      }
    });

    it("should generate all-rights-reserved notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "all-rights",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("All rights reserved");
        expect(output).toContain("No part of this work may be reproduced");
      }
    });

    it("should generate HTML copyright notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "html",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("<p>");
        expect(output).toContain("&copy;");
      }
    });

    it("should generate code comment notice", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        format: "code-comment",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("/**");
        expect(output).toContain(" */");
        expect(output).toContain("Copyright (c)");
      }
    });

    it("should use custom holder and year", async () => {
      const result = await executeTool(copyrightNoticeGenerator, {
        holder: "My Company Inc.",
        year: "2020-2024",
        format: "standard",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const output = (result.data as Record<string, unknown>)
          .output as string;
        expect(output).toContain("My Company Inc.");
        expect(output).toContain("2020-2024");
      }
    });
  });
});
