import { describe, it, expect } from "vitest";
import { licensePicker } from "../../../src/tools/markdown/license-picker";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("licensePicker", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(licensePicker.meta.id).toBe("markdown/license-picker");
      expect(licensePicker.meta.name).toBe("License Picker");
      expect(licensePicker.meta.category).toBe("markdown");
      expect(licensePicker.meta.tier).toBe(ToolTier.CLIENT);
      expect(licensePicker.meta.keywords).toContain("license");
      expect(licensePicker.meta.keywords).toContain("mit");
    });
  });

  describe("execute", () => {
    it("should generate MIT license", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2024,
        author: "John Doe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "MIT License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Copyright (c) 2024 John Doe"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Permission is hereby granted"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "THE SOFTWARE IS PROVIDED"
        );
        expect((result.data as Record<string, unknown>).spdxId).toBe("MIT");
      }
    });

    it("should generate Apache-2.0 license", async () => {
      const result = await executeTool(licensePicker, {
        type: "Apache-2.0",
        year: 2024,
        author: "Jane Smith",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Apache License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Version 2.0"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Copyright 2024 Jane Smith"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "http://www.apache.org/licenses/"
        );
        expect((result.data as Record<string, unknown>).spdxId).toBe(
          "Apache-2.0"
        );
      }
    });

    it("should generate GPL-3.0 license", async () => {
      const result = await executeTool(licensePicker, {
        type: "GPL-3.0",
        year: 2024,
        author: "Bob Wilson",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "GNU GENERAL PUBLIC LICENSE"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Version 3"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Copyright (C) 2024 Bob Wilson"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "free software"
        );
        expect((result.data as Record<string, unknown>).spdxId).toBe("GPL-3.0");
      }
    });

    it("should generate BSD-3-Clause license", async () => {
      const result = await executeTool(licensePicker, {
        type: "BSD-3-Clause",
        year: 2024,
        author: "Alice Brown",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "BSD 3-Clause License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Copyright (c) 2024, Alice Brown"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Redistribution and use"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "1. Redistributions of source code"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "2. Redistributions in binary form"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "3. Neither the name"
        );
        expect((result.data as Record<string, unknown>).spdxId).toBe(
          "BSD-3-Clause"
        );
      }
    });

    it("should generate ISC license", async () => {
      const result = await executeTool(licensePicker, {
        type: "ISC",
        year: 2024,
        author: "Charlie Davis",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "ISC License"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Copyright (c) 2024, Charlie Davis"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "Permission to use, copy, modify"
        );
        expect((result.data as Record<string, unknown>).spdxId).toBe("ISC");
      }
    });

    it("should replace year placeholder correctly", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2025,
        author: "Test Author",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "2025"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "{{YEAR}}"
        );
      }
    });

    it("should replace author placeholder correctly", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2024,
        author: "Organization Name Inc.",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Organization Name Inc."
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "{{AUTHOR}}"
        );
      }
    });

    it("should fail with year below 1900", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 1899,
        author: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("should fail with year above 2100", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2101,
        author: "Test",
      });

      expect(result.success).toBe(false);
    });

    it("should fail with empty author", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2024,
        author: "",
      });

      expect(result.success).toBe(false);
    });

    it("should return correct SPDX identifier", async () => {
      const licenses = [
        "MIT",
        "Apache-2.0",
        "GPL-3.0",
        "BSD-3-Clause",
        "ISC",
      ] as const;

      for (const type of licenses) {
        const result = await executeTool(licensePicker, {
          type,
          year: 2024,
          author: "Test",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).spdxId).toBe(type);
        }
      }
    });

    it("should handle special characters in author name", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2024,
        author: "John O'Connor & Associates",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "John O'Connor & Associates"
        );
      }
    });

    it("should include warranty disclaimer in MIT", async () => {
      const result = await executeTool(licensePicker, {
        type: "MIT",
        year: 2024,
        author: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "WITHOUT WARRANTY OF ANY KIND"
        );
        expect((result.data as Record<string, unknown>).output).toContain(
          "AS IS"
        );
      }
    });

    it("should include modification rights in Apache", async () => {
      const result = await executeTool(licensePicker, {
        type: "Apache-2.0",
        year: 2024,
        author: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "Licensed under the Apache License"
        );
      }
    });

    it("should include GPL reference link", async () => {
      const result = await executeTool(licensePicker, {
        type: "GPL-3.0",
        year: 2024,
        author: "Test",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toContain(
          "https://www.gnu.org/licenses/"
        );
      }
    });
  });
});
