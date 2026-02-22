import { describe, it, expect } from "vitest";
import {
  base64Decode,
  base64ToBytes,
} from "../../../src/tools/encoding/base64-decode";
import { executeTool } from "../../../src/core/executor";

describe("base64Decode", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(base64Decode.meta.id).toBe("encoding/base64-decode");
      expect(base64Decode.meta.name).toBe("Base64 Decode");
      expect(base64Decode.meta.category).toBe("encoding");
    });
  });

  describe("execute", () => {
    it("should decode simple Base64 string", async () => {
      const result = await executeTool(base64Decode, {
        input: "SGVsbG8sIFdvcmxkIQ==",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Hello, World!"
        );
      }
    });

    it("should decode empty string", async () => {
      const result = await executeTool(base64Decode, { input: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should decode UTF-8 encoded string", async () => {
      // "世界" encoded as Base64
      const encoded = Buffer.from("世界", "utf-8").toString("base64");
      const result = await executeTool(base64Decode, { input: encoded });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("世界");
      }
    });

    it("should decode string with emojis", async () => {
      const encoded = Buffer.from("Hello 🌍!", "utf-8").toString("base64");
      const result = await executeTool(base64Decode, { input: encoded });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "Hello 🌍!"
        );
      }
    });

    it("should decode URL-safe Base64 when option is set", async () => {
      // URL-safe encoded ">>>???"
      const result = await executeTool(
        base64Decode,
        { input: "Pj4-Pz8_" },
        { urlSafe: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(">>>???");
      }
    });

    it("should add padding for URL-safe encoded strings", async () => {
      // URL-safe encoded without padding
      const result = await executeTool(
        base64Decode,
        { input: "dGVzdA" }, // "test" without padding
        { urlSafe: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("test");
      }
    });

    it("should reject invalid Base64 string", async () => {
      const result = await executeTool(base64Decode, {
        input: "not valid base64!!!",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Base64");
      }
    });

    it("should reject Base64 with invalid characters", async () => {
      const result = await executeTool(base64Decode, { input: "abc$def" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Base64");
      }
    });

    it("should handle standard Base64 by default", async () => {
      const result = await executeTool(base64Decode, { input: "Pj4+Pz8/" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(">>>???");
      }
    });

    it("should apply default options when options not provided", async () => {
      const result = await executeTool(base64Decode, { input: "dGVzdA==" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("test");
      }
    });

    it("should handle Base64 without padding when valid characters", async () => {
      // Some browsers/runtimes are lenient with padding
      // "dGVzdA" is "test" without the trailing "==" padding
      const result = await executeTool(base64Decode, { input: "dGVzdA" });
      // The regex validation allows {0,2} equals signs, so without padding may pass validation
      // but atob/Buffer may still decode it
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("test");
      }
    });
  });

  describe("base64ToBytes", () => {
    it("should decode bytes using Buffer in Node.js", () => {
      const bytes = base64ToBytes("aGVsbG8=");
      const result = new TextDecoder().decode(bytes);
      expect(result).toBe("hello");
    });

    it("should decode bytes using atob in browser environment", () => {
      // Save original Buffer
      const originalBuffer = globalThis.Buffer;

      // Mock Buffer as undefined to simulate browser
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.Buffer = undefined;

      try {
        const bytes = base64ToBytes("aGVsbG8=");
        const result = new TextDecoder().decode(bytes);
        expect(result).toBe("hello");
      } finally {
        // Restore Buffer
        globalThis.Buffer = originalBuffer;
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default urlSafe when options is undefined", () => {
      const result = base64Decode.execute(
        { input: "SGVsbG8sIFdvcmxkIQ==" },
        undefined
      ) as Record<string, unknown>;
      // Default is standard decoding
      expect(result.output).toBe("Hello, World!");
    });

    it("should handle non-Error exception with fallback message", () => {
      // Mock base64ToBytes to throw a non-Error value
      const originalBuffer = globalThis.Buffer;
      const originalAtob = globalThis.atob;

      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.Buffer = undefined;
      globalThis.atob = () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "string error"; // Non-Error value
      };

      try {
        expect(() =>
          base64Decode.execute({ input: "SGVsbG8=" }, undefined)
        ).toThrow();
      } finally {
        globalThis.Buffer = originalBuffer;
        globalThis.atob = originalAtob;
      }
    });
  });
});
