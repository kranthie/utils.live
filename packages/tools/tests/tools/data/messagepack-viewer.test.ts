import { describe, it, expect } from "vitest";
import { messagepackViewer } from "../../../src/tools/data/messagepack-viewer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

/**
 * Helper to create base64 from bytes.
 */
function toBase64(bytes: number[]): string {
  const uint8 = new Uint8Array(bytes);
  let binary = "";
  for (const byte of uint8) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

describe("messagepackViewer", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(messagepackViewer.meta.id).toBe("data/messagepack-viewer");
    });

    it("should have correct name", () => {
      expect(messagepackViewer.meta.name).toBe("MessagePack Viewer");
    });

    it("should be in data category", () => {
      expect(messagepackViewer.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(messagepackViewer.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(messagepackViewer.meta.keywords).toContain("messagepack");
      expect(messagepackViewer.meta.keywords).toContain("msgpack");
      expect(messagepackViewer.meta.keywords).toContain("binary");
    });
  });

  describe("execute", () => {
    it("should decode positive fixint", async () => {
      // 0x05 = positive fixint 5
      const input = toBase64([0x05]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(5);
        expect((result.data as Record<string, unknown>).byteLength).toBe(1);
        expect((result.data as Record<string, unknown>).format).toContain(
          "Positive fixint"
        );
      }
    });

    it("should decode negative fixint", async () => {
      // 0xff = negative fixint -1
      const input = toBase64([0xff]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(-1);
        expect((result.data as Record<string, unknown>).format).toContain(
          "Negative fixint"
        );
      }
    });

    it("should decode nil", async () => {
      // 0xc0 = nil
      const input = toBase64([0xc0]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBeNull();
        expect((result.data as Record<string, unknown>).format).toBe("Nil");
      }
    });

    it("should decode boolean false", async () => {
      // 0xc2 = false
      const input = toBase64([0xc2]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(false);
        expect((result.data as Record<string, unknown>).format).toContain(
          "Boolean"
        );
      }
    });

    it("should decode boolean true", async () => {
      // 0xc3 = true
      const input = toBase64([0xc3]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(true);
        expect((result.data as Record<string, unknown>).format).toContain(
          "Boolean"
        );
      }
    });

    it("should decode fixstr", async () => {
      // 0xa5 + "hello" = fixstr with 5 bytes
      const input = toBase64([0xa5, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe("hello");
        expect((result.data as Record<string, unknown>).format).toContain(
          "Fixstr"
        );
      }
    });

    it("should decode empty fixstr", async () => {
      // 0xa0 = empty fixstr
      const input = toBase64([0xa0]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe("");
      }
    });

    it("should decode fixarray", async () => {
      // 0x93 + [1, 2, 3] = fixarray with 3 elements
      const input = toBase64([0x93, 0x01, 0x02, 0x03]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual([
          1, 2, 3,
        ]);
        expect((result.data as Record<string, unknown>).format).toContain(
          "Fixarray"
        );
      }
    });

    it("should decode empty fixarray", async () => {
      // 0x90 = empty fixarray
      const input = toBase64([0x90]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual([]);
      }
    });

    it("should decode fixmap", async () => {
      // 0x81 + "a" + 1 = fixmap with 1 element {"a": 1}
      const input = toBase64([0x81, 0xa1, 0x61, 0x01]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual({
          a: 1,
        });
        expect((result.data as Record<string, unknown>).format).toContain(
          "Fixmap"
        );
      }
    });

    it("should decode uint8", async () => {
      // 0xcc + 200 = uint8
      const input = toBase64([0xcc, 0xc8]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(200);
        expect((result.data as Record<string, unknown>).format).toBe("Uint8");
      }
    });

    it("should decode uint16", async () => {
      // 0xcd + 1000 (big-endian)
      const input = toBase64([0xcd, 0x03, 0xe8]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(1000);
        expect((result.data as Record<string, unknown>).format).toBe("Uint16");
      }
    });

    it("should decode int8 positive", async () => {
      // 0xd0 + 100
      const input = toBase64([0xd0, 0x64]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(100);
      }
    });

    it("should decode int8 negative", async () => {
      // 0xd0 + -100 (0x9c in two's complement)
      const input = toBase64([0xd0, 0x9c]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(-100);
      }
    });

    it("should decode nested structure", async () => {
      // {"name": "test", "value": 42}
      // 0x82 (fixmap 2) + "name" + "test" + "value" + 42
      const input = toBase64([
        0x82, // fixmap with 2 elements
        0xa4,
        0x6e,
        0x61,
        0x6d,
        0x65, // "name"
        0xa4,
        0x74,
        0x65,
        0x73,
        0x74, // "test"
        0xa5,
        0x76,
        0x61,
        0x6c,
        0x75,
        0x65, // "value"
        0x2a, // 42
      ]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual({
          name: "test",
          value: 42,
        });
      }
    });

    it("should return hex representation", async () => {
      const input = toBase64([0x05, 0xc3]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hex).toBe("05 c3");
      }
    });

    it("should fail for invalid base64", async () => {
      const result = await executeTool(messagepackViewer, {
        input: "not valid base64!!!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BASE64_DECODE_ERROR");
      }
    });

    it("should fail for empty data", async () => {
      const result = await executeTool(messagepackViewer, { input: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("MESSAGEPACK_DECODE_ERROR");
      }
    });

    it("should include execution metadata", async () => {
      const input = toBase64([0x05]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("extended type decoding", () => {
    it("should decode uint32", async () => {
      // 0xce + 70000 = uint32 (big-endian: 0x00011170)
      const input = toBase64([0xce, 0x00, 0x01, 0x11, 0x70]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(70000);
        expect((result.data as Record<string, unknown>).format).toBe("Uint32");
      }
    });

    it("should decode uint64 within safe integer range", async () => {
      // 0xcf + value 1000000 (big-endian 8 bytes)
      const input = toBase64([
        0xcf, 0x00, 0x00, 0x00, 0x00, 0x00, 0x0f, 0x42, 0x40,
      ]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(1000000);
        expect((result.data as Record<string, unknown>).format).toBe("Uint64");
      }
    });

    it("should decode int32", async () => {
      // 0xd2 + -70000 in two's complement big-endian (0xFFFEEE90)
      const input = toBase64([0xd2, 0xff, 0xfe, 0xee, 0x90]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(-70000);
        expect((result.data as Record<string, unknown>).format).toBe("Int32");
      }
    });

    it("should decode int64 within safe integer range", async () => {
      // 0xd3 + -1000000 (big-endian 8 bytes two's complement: 0xFFFFFFFFFFF0BDC0)
      const input = toBase64([
        0xd3, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf0, 0xbd, 0xc0,
      ]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe(-1000000);
        expect((result.data as Record<string, unknown>).format).toBe("Int64");
      }
    });

    it("should decode str8", async () => {
      // 0xd9 + length(5) + "hello"
      const input = toBase64([0xd9, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe("hello");
        expect((result.data as Record<string, unknown>).format).toBe("Str8");
      }
    });

    it("should decode str16", async () => {
      // 0xda + length(5, big-endian 2 bytes) + "hello"
      const input = toBase64([0xda, 0x00, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe("hello");
        expect((result.data as Record<string, unknown>).format).toBe("Str16");
      }
    });

    it("should decode str32", async () => {
      // 0xdb + length(5, big-endian 4 bytes) + "hello"
      const input = toBase64([
        0xdb, 0x00, 0x00, 0x00, 0x05, 0x68, 0x65, 0x6c, 0x6c, 0x6f,
      ]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toBe("hello");
        expect((result.data as Record<string, unknown>).format).toBe("Str32");
      }
    });

    it("should decode array16", async () => {
      // 0xdc + count(3, big-endian 2 bytes) + [1, 2, 3] as positive fixints
      const input = toBase64([0xdc, 0x00, 0x03, 0x01, 0x02, 0x03]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual([
          1, 2, 3,
        ]);
        expect((result.data as Record<string, unknown>).format).toBe("Array16");
      }
    });

    it("should decode array32", async () => {
      // 0xdd + count(3, big-endian 4 bytes) + [1, 2, 3] as positive fixints
      const input = toBase64([0xdd, 0x00, 0x00, 0x00, 0x03, 0x01, 0x02, 0x03]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual([
          1, 2, 3,
        ]);
        expect((result.data as Record<string, unknown>).format).toBe("Array32");
      }
    });

    it("should decode map16", async () => {
      // 0xde + count(1, big-endian 2 bytes) + "a" + 1
      const input = toBase64([0xde, 0x00, 0x01, 0xa1, 0x61, 0x01]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual({
          a: 1,
        });
        expect((result.data as Record<string, unknown>).format).toBe("Map16");
      }
    });

    it("should decode map32", async () => {
      // 0xdf + count(1, big-endian 4 bytes) + "a" + 1
      const input = toBase64([0xdf, 0x00, 0x00, 0x00, 0x01, 0xa1, 0x61, 0x01]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).decoded).toEqual({
          a: 1,
        });
        expect((result.data as Record<string, unknown>).format).toBe("Map32");
      }
    });

    it("should decode bin8 as hex string", async () => {
      // 0xc4 + length(3) + [0xde, 0xad, 0xbe]
      const input = toBase64([0xc4, 0x03, 0xde, 0xad, 0xbe]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).format).toBe("Bin8");
        // Binary decoded as hex string
        expect((result.data as Record<string, unknown>).decoded).toBe("deadbe");
      }
    });

    it("should decode bin16 as hex string", async () => {
      // 0xc5 + length(2, big-endian) + [0xca, 0xfe]
      const input = toBase64([0xc5, 0x00, 0x02, 0xca, 0xfe]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).format).toBe("Bin16");
        expect((result.data as Record<string, unknown>).decoded).toBe("cafe");
      }
    });

    it("should decode bin32 as hex string", async () => {
      // 0xc6 + length(2, big-endian 4 bytes) + [0xbe, 0xef]
      const input = toBase64([0xc6, 0x00, 0x00, 0x00, 0x02, 0xbe, 0xef]);
      const result = await executeTool(messagepackViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).format).toBe("Bin32");
        expect((result.data as Record<string, unknown>).decoded).toBe("beef");
      }
    });
  });

  describe("execute function directly", () => {
    it("should decode when called directly", () => {
      const input = toBase64([0x05]);
      const result = messagepackViewer.execute({ input }) as Record<
        string,
        unknown
      >;
      expect(result.decoded).toBe(5);
      expect(result.byteLength).toBe(1);
    });
  });
});
