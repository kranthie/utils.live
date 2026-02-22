import { describe, it, expect } from "vitest";
import {
  globalRegistry,
  getAllTools,
  searchTools,
  getToolsByCategory,
  getToolById,
  executeTool,
  jsonFormatter,
  jsonValidator,
  base64Encode,
  base64Decode,
} from "../../src";

describe("Auto-registration", () => {
  describe("global registry", () => {
    it("should have all tools registered automatically", () => {
      const tools = getAllTools();
      expect(tools.length).toBeGreaterThanOrEqual(4);
    });

    it("should register JSON tools", () => {
      expect(globalRegistry.has("json/formatter")).toBe(true);
      expect(globalRegistry.has("json/validator")).toBe(true);
    });

    it("should register encoding tools", () => {
      expect(globalRegistry.has("encoding/base64-encode")).toBe(true);
      expect(globalRegistry.has("encoding/base64-decode")).toBe(true);
    });
  });

  describe("tool lookup", () => {
    it("should find tool by ID", () => {
      const tool = getToolById("json/formatter");
      expect(tool).toBeDefined();
      expect(tool?.meta.name).toBe("JSON Formatter");
    });

    it("should find tools by category", () => {
      const jsonTools = getToolsByCategory("json");
      // We have many JSON tools registered
      expect(jsonTools.length).toBeGreaterThanOrEqual(14);
      expect(jsonTools.some((t) => t.meta.id === "json/formatter")).toBe(true);
      expect(jsonTools.some((t) => t.meta.id === "json/validator")).toBe(true);
    });

    it("should find tools by search", () => {
      const results = searchTools("base64");
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((t) => t.meta.id === "encoding/base64-encode")).toBe(
        true
      );
      expect(results.some((t) => t.meta.id === "encoding/base64-decode")).toBe(
        true
      );
    });
  });

  describe("tool execution from registry", () => {
    it("should execute JSON formatter from registry", async () => {
      const tool = getToolById("json/formatter");
      expect(tool).toBeDefined();
      if (tool) {
        const result = await executeTool(tool, { input: '{"a":1}' });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            '{\n  "a": 1\n}'
          );
        }
      }
    });

    it("should execute Base64 encode from registry", async () => {
      const tool = getToolById("encoding/base64-encode");
      expect(tool).toBeDefined();
      if (tool) {
        const result = await executeTool(tool, { input: "Hello, World!" });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "SGVsbG8sIFdvcmxkIQ=="
          );
        }
      }
    });

    it("should execute Base64 decode from registry", async () => {
      const tool = getToolById("encoding/base64-decode");
      expect(tool).toBeDefined();
      if (tool) {
        const result = await executeTool(tool, {
          input: "SGVsbG8sIFdvcmxkIQ==",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect((result.data as Record<string, unknown>).output).toBe(
            "Hello, World!"
          );
        }
      }
    });
  });

  describe("direct tool exports", () => {
    it("should export jsonFormatter directly", () => {
      expect(jsonFormatter).toBeDefined();
      expect(jsonFormatter.meta.id).toBe("json/formatter");
    });

    it("should export jsonValidator directly", () => {
      expect(jsonValidator).toBeDefined();
      expect(jsonValidator.meta.id).toBe("json/validator");
    });

    it("should export base64Encode directly", () => {
      expect(base64Encode).toBeDefined();
      expect(base64Encode.meta.id).toBe("encoding/base64-encode");
    });

    it("should export base64Decode directly", () => {
      expect(base64Decode).toBeDefined();
      expect(base64Decode.meta.id).toBe("encoding/base64-decode");
    });
  });

  describe("Base64 tools functionality", () => {
    it("should encode and decode round-trip", async () => {
      const original = "Hello, 世界! 🌍";

      // Encode
      const encodeResult = await executeTool(base64Encode, { input: original });
      expect(encodeResult.success).toBe(true);
      if (!encodeResult.success) return;

      const encoded = (encodeResult.data as { output: string }).output;

      // Decode
      const decodeResult = await executeTool(base64Decode, { input: encoded });
      expect(decodeResult.success).toBe(true);
      if (!decodeResult.success) return;

      expect((decodeResult.data as { output: string }).output).toBe(original);
    });

    it("should support URL-safe encoding", async () => {
      // Input that produces + and / in standard Base64
      const input = ">>>???";

      // Standard encoding
      const standardResult = await executeTool(base64Encode, { input });
      expect(standardResult.success).toBe(true);

      // URL-safe encoding
      const urlSafeResult = await executeTool(
        base64Encode,
        { input },
        { urlSafe: true }
      );
      expect(urlSafeResult.success).toBe(true);

      if (urlSafeResult.success) {
        const output = (urlSafeResult.data as { output: string }).output;
        // Should not contain + or /
        expect(output).not.toContain("+");
        expect(output).not.toContain("/");
        expect(output).not.toContain("=");
      }
    });

    it("should decode URL-safe encoded strings", async () => {
      // URL-safe encoded ">>>???"
      const urlSafeEncoded = "Pj4-Pz8_";

      const result = await executeTool(
        base64Decode,
        { input: urlSafeEncoded },
        { urlSafe: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(">>>???");
      }
    });

    it("should reject invalid Base64", async () => {
      const result = await executeTool(base64Decode, {
        input: "not valid base64!!!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Base64");
      }
    });
  });
});
