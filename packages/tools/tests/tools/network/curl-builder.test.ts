import { describe, it, expect } from "vitest";
import { curlBuilder } from "../../../src/tools/network/curl-builder";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("curlBuilder", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(curlBuilder.meta.id).toBe("network/curl-builder");
      expect(curlBuilder.meta.category).toBe("network");
      expect(curlBuilder.meta.tier).toBe(ToolTier.CLIENT);
      expect(curlBuilder.meta.keywords).toContain("curl");
    });
  });

  describe("execute", () => {
    it("should build a simple GET request", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("curl");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("https://api.example.com/data");
        // GET is default, so -X GET should not be included
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).not.toContain("-X GET");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("-L");
      }
    });

    it("should build a POST request with JSON body", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/users",
        method: "POST",
        contentType: "application/json",
        body: '{"name":"John"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("-X POST");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("Content-Type: application/json");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain('{"name":"John"}');
      }
    });

    it("should include bearer token auth", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
        auth: {
          type: "bearer",
          token: "my-token-123",
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("Authorization: Bearer my-token-123");
      }
    });

    it("should include basic auth", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
        auth: {
          type: "basic",
          username: "admin",
          password: "secret",
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("-u");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("admin:secret");
      }
    });

    it("should include custom headers", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
        headers: [
          { key: "Accept", value: "application/json" },
          { key: "X-Custom", value: "test-value" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("Accept: application/json");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("X-Custom: test-value");
      }
    });

    it("should include flags like insecure and verbose", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
        insecure: true,
        verbose: true,
        compressed: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("-k");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("-v");
        expect(
          (result.data as Record<string, unknown>).commandOneLine
        ).toContain("--compressed");
      }
    });

    it("should generate multi-line command", async () => {
      const result = await executeTool(curlBuilder, {
        url: "https://api.example.com/data",
        method: "POST",
        contentType: "application/json",
        body: '{"key":"value"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).command).toContain(
          "\\"
        );
        expect(
          (result.data as Record<string, unknown>).commandParts.length
        ).toBeGreaterThan(2);
      }
    });

    it("should fail when URL is empty", async () => {
      const result = await executeTool(curlBuilder, {
        url: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
