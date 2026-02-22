import { describe, it, expect } from "vitest";
import { httpStatusReference } from "../../../src/tools/network/http-status-reference";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

describe("httpStatusReference", () => {
  describe("metadata", () => {
    it("should have correct metadata", () => {
      expect(httpStatusReference.meta.id).toBe("network/http-status-reference");
      expect(httpStatusReference.meta.name).toBe("HTTP Status Reference");
      expect(httpStatusReference.meta.category).toBe("network");
      expect(httpStatusReference.meta.tier).toBe(ToolTier.CLIENT);
      expect(httpStatusReference.meta.keywords).toContain("http");
      expect(httpStatusReference.meta.keywords).toContain("status");
    });
  });

  describe("execute", () => {
    it("should look up a specific status code", async () => {
      const result = await executeTool(httpStatusReference, { input: "404" });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results).toHaveLength(1);
        expect(results[0].code).toBe(404);
        expect(results[0].phrase).toBe("Not Found");
        expect(results[0].category).toBe("Client Error");
      }
    });

    it("should look up status code 200", async () => {
      const result = await executeTool(httpStatusReference, { input: "200" });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results).toHaveLength(1);
        expect(results[0].code).toBe(200);
        expect(results[0].phrase).toBe("OK");
      }
    });

    it("should look up a category with Nxx pattern", async () => {
      const result = await executeTool(httpStatusReference, { input: "2xx" });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results.length).toBeGreaterThan(1);
        expect(
          results.every(
            (r: Record<string, unknown>) =>
              (r.code as number) >= 200 && (r.code as number) < 300
          )
        ).toBe(true);
      }
    });

    it("should search by text", async () => {
      const result = await executeTool(httpStatusReference, {
        input: "not found",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(
          results.some((r: Record<string, unknown>) => r.code === 404)
        ).toBe(true);
      }
    });

    it("should return all 5xx server errors", async () => {
      const result = await executeTool(httpStatusReference, { input: "5xx" });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results.length).toBeGreaterThan(5);
        expect(
          results.every(
            (r: Record<string, unknown>) =>
              (r.code as number) >= 500 && (r.code as number) < 600
          )
        ).toBe(true);
      }
    });

    it("should handle the teapot status code", async () => {
      const result = await executeTool(httpStatusReference, { input: "418" });
      expect(result.success).toBe(true);
      if (result.success) {
        const results = (result.data as Record<string, unknown>)
          .results as Record<string, unknown>[];
        expect(results).toHaveLength(1);
        expect(results[0].phrase).toBe("I'm a Teapot");
      }
    });

    it("should return empty results for unknown code", async () => {
      const result = await executeTool(httpStatusReference, { input: "999" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).results).toHaveLength(
          0
        );
      }
    });

    it("should fail on empty input", async () => {
      const result = await executeTool(httpStatusReference, { input: "   " });
      expect(result.success).toBe(false);
    });
  });
});
