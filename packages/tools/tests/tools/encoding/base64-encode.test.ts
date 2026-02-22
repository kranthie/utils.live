import { describe, it, expect } from "vitest";
import {
  base64Encode,
  bytesToBase64,
} from "../../../src/tools/encoding/base64-encode";
import { executeTool } from "../../../src/core/executor";

describe("base64Encode", () => {
  describe("meta", () => {
    it("should have correct tool metadata", () => {
      expect(base64Encode.meta.id).toBe("encoding/base64-encode");
      expect(base64Encode.meta.name).toBe("Base64 Encode");
      expect(base64Encode.meta.category).toBe("encoding");
    });
  });

  describe("execute", () => {
    it("should encode simple ASCII string", async () => {
      const result = await executeTool(base64Encode, {
        input: "Hello, World!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe(
          "SGVsbG8sIFdvcmxkIQ=="
        );
      }
    });

    it("should encode empty string", async () => {
      const result = await executeTool(base64Encode, { input: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).output).toBe("");
      }
    });

    it("should encode UTF-8 string with multibyte characters", async () => {
      const result = await executeTool(base64Encode, { input: "世界" });
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify we can decode it back
        const decoded = Buffer.from(
          (result.data as Record<string, unknown>).output as string,
          "base64"
        ).toString("utf-8");
        expect(decoded).toBe("世界");
      }
    });

    it("should encode string with emojis", async () => {
      const result = await executeTool(base64Encode, { input: "Hello 🌍!" });
      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = Buffer.from(
          (result.data as Record<string, unknown>).output as string,
          "base64"
        ).toString("utf-8");
        expect(decoded).toBe("Hello 🌍!");
      }
    });

    it("should use URL-safe encoding when option is set", async () => {
      // Use input that produces + and / in standard Base64
      const result = await executeTool(
        base64Encode,
        { input: ">>>???" },
        { urlSafe: true }
      );
      expect(result.success).toBe(true);
      if (result.success) {
        // URL-safe encoding should not contain + or /
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "+"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "/"
        );
        expect((result.data as Record<string, unknown>).output).not.toContain(
          "="
        );
      }
    });

    it("should use standard encoding by default", async () => {
      const result = await executeTool(base64Encode, { input: ">>>???" });
      expect(result.success).toBe(true);
      if (result.success) {
        // Standard encoding can contain + and /
        expect((result.data as Record<string, unknown>).output).toBe(
          "Pj4+Pz8/"
        );
      }
    });

    it("should apply default options when options not provided", async () => {
      const result = await executeTool(base64Encode, { input: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        // Should use standard (non-URL-safe) encoding
        expect((result.data as Record<string, unknown>).output).toBe(
          "dGVzdA=="
        );
      }
    });

    it("should handle special characters", async () => {
      const result = await executeTool(base64Encode, { input: "\n\t\r" });
      expect(result.success).toBe(true);
    });

    it("should handle long strings", async () => {
      const longString = "a".repeat(10000);
      const result = await executeTool(base64Encode, { input: longString });
      expect(result.success).toBe(true);
    });
  });

  describe("bytesToBase64", () => {
    it("should encode bytes using Buffer in Node.js", () => {
      const bytes = new TextEncoder().encode("hello");
      const result = bytesToBase64(bytes);
      expect(result).toBe("aGVsbG8=");
    });

    it("should encode bytes using btoa in browser environment", () => {
      // Save original Buffer
      const originalBuffer = globalThis.Buffer;

      // Mock Buffer as undefined to simulate browser
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.Buffer = undefined;

      try {
        const bytes = new TextEncoder().encode("hello");
        const result = bytesToBase64(bytes);
        expect(result).toBe("aGVsbG8=");
      } finally {
        // Restore Buffer
        globalThis.Buffer = originalBuffer;
      }
    });
  });

  describe("error handling", () => {
    it("should handle encoding errors gracefully", async () => {
      // Mock bytesToBase64 to throw an error
      const originalBuffer = globalThis.Buffer;
      const originalBtoa = globalThis.btoa;

      // Remove both Buffer and btoa to force an error
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.Buffer = undefined;
      // @ts-expect-error - intentionally setting to undefined for testing
      globalThis.btoa = undefined;

      try {
        const result = await executeTool(base64Encode, { input: "test" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe("EXEC_FAILED");
          expect(result.error.message).toContain("Base64 encoding failed");
        }
      } finally {
        globalThis.Buffer = originalBuffer;
        globalThis.btoa = originalBtoa;
      }
    });
  });

  describe("execute function directly", () => {
    it("should use default urlSafe when options is undefined", () => {
      const result = base64Encode.execute(
        { input: "Hello, World!" },
        undefined
      ) as Record<string, unknown>;
      // Default is standard encoding with padding
      expect(result.output).toBe("SGVsbG8sIFdvcmxkIQ==");
    });

    it("should handle non-Error exception with fallback message", () => {
      // Mock TextEncoder to throw a non-Error value
      const originalTextEncoder = globalThis.TextEncoder;
      // @ts-expect-error - mock TextEncoder
      globalThis.TextEncoder = class {
        encode(): Uint8Array {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw "string error"; // Non-Error value
        }
      };

      try {
        expect(() =>
          base64Encode.execute({ input: "test" }, undefined)
        ).toThrow();
      } finally {
        globalThis.TextEncoder = originalTextEncoder;
      }
    });
  });
});
