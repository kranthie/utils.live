import { describe, it, expect } from "vitest";
import { avroViewer } from "../../../src/tools/data/avro-viewer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface AvroViewerOutput {
  hex: string;
  byteLength: number;
  isObjectContainer: boolean;
  header?: {
    magic: string;
    metadata: Record<string, string>;
    syncMarker: string;
  };
  schema?: unknown;
  blocks?: Array<{
    objectCount: number;
    compressedSize: number;
    dataPreview: string;
  }>;
  summary: string;
}

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

/**
 * Helper to encode Avro zigzag varint.
 */
function encodeAvroVarint(value: bigint): number[] {
  // Zigzag encode
  const zigzag =
    value >= BigInt(0) ? value * BigInt(2) : -value * BigInt(2) - BigInt(1);

  const bytes: number[] = [];
  let v = zigzag;
  while (v >= BigInt(0x80)) {
    bytes.push(Number(v & BigInt(0x7f)) | 0x80);
    v >>= BigInt(7);
  }
  bytes.push(Number(v));
  return bytes;
}

/**
 * Helper to encode Avro string.
 */
function encodeAvroString(str: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return [...encodeAvroVarint(BigInt(bytes.length)), ...bytes];
}

/**
 * Creates a minimal Avro Object Container File.
 */
function createAvroContainerFile(schema: object, codec = "null"): number[] {
  // Magic bytes: "Obj" + 0x01
  const magic = [0x4f, 0x62, 0x6a, 0x01];

  // Metadata map: {"avro.schema": schema, "avro.codec": codec}
  const schemaStr = JSON.stringify(schema);
  const schemaKey = encodeAvroString("avro.schema");
  const schemaValue = encodeAvroString(schemaStr);
  const codecKey = encodeAvroString("avro.codec");
  const codecValue = encodeAvroString(codec);

  // Map with 2 entries, then 0 to end
  const metadata = [
    ...encodeAvroVarint(BigInt(2)),
    ...schemaKey,
    ...schemaValue,
    ...codecKey,
    ...codecValue,
    ...encodeAvroVarint(BigInt(0)),
  ];

  // 16-byte sync marker (random but fixed for testing)
  const syncMarker = [
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
    0x0d, 0x0e, 0x0f, 0x10,
  ];

  return [...magic, ...metadata, ...syncMarker];
}

describe("avroViewer", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(avroViewer.meta.id).toBe("data/avro-viewer");
    });

    it("should have correct name", () => {
      expect(avroViewer.meta.name).toBe("Avro Viewer");
    });

    it("should be in data category", () => {
      expect(avroViewer.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(avroViewer.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(avroViewer.meta.keywords).toContain("avro");
      expect(avroViewer.meta.keywords).toContain("schema");
      expect(avroViewer.meta.keywords).toContain("apache");
    });
  });

  describe("execute", () => {
    it("should detect non-Avro container file", async () => {
      // Random bytes that don't start with Avro magic
      const input = toBase64([0x01, 0x02, 0x03, 0x04, 0x05]);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).isObjectContainer).toBe(
          false
        );
        expect((result.data as Record<string, unknown>).byteLength).toBe(5);
        expect((result.data as Record<string, unknown>).summary).toContain(
          "not an Avro Object Container"
        );
      }
    });

    it("should detect Avro magic bytes", async () => {
      const schema = { type: "string" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as AvroViewerOutput;
        expect(data.isObjectContainer).toBe(true);
        expect(data.header).toBeDefined();
        if (data.header) {
          expect(data.header.magic).toBe("Obj\\x01");
        }
      }
    });

    it("should parse schema from metadata", async () => {
      const schema = { type: "record", name: "Test", fields: [] };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as AvroViewerOutput;
        expect(data.schema).toBeDefined();
        expect(data.schema).toEqual(schema);
        if (data.header) {
          expect(data.header.metadata["avro.schema"]).toBeDefined();
        }
      }
    });

    it("should extract codec from metadata", async () => {
      const schema = { type: "string" };
      const bytes = createAvroContainerFile(schema, "deflate");
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as AvroViewerOutput;
        if (data.header) {
          expect(data.header.metadata["avro.codec"]).toBe("deflate");
        }
        expect(data.summary).toContain("deflate");
      }
    });

    it("should display sync marker", async () => {
      const schema = { type: "int" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as AvroViewerOutput;
        if (data.header) {
          expect(data.header.syncMarker).toBeDefined();
          expect(data.header.syncMarker).toContain("01");
        }
      }
    });

    it("should return hex representation", async () => {
      // Use non-Avro data to get hex without triggering container parsing
      const input = toBase64([0x01, 0x02, 0x03, 0x04]);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).hex).toBe(
          "01 02 03 04"
        );
        expect((result.data as Record<string, unknown>).isObjectContainer).toBe(
          false
        );
      }
    });

    it("should handle primitive schema types", async () => {
      const schema = { type: "long" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).schema).toEqual(schema);
        expect((result.data as Record<string, unknown>).summary).toContain(
          "schema type: long"
        );
      }
    });

    it("should handle record schema types", async () => {
      const schema = {
        type: "record",
        name: "User",
        fields: [
          { name: "id", type: "int" },
          { name: "name", type: "string" },
        ],
      };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).schema).toEqual(schema);
        expect((result.data as Record<string, unknown>).summary).toContain(
          "schema type: record"
        );
      }
    });

    it("should handle array schema types", async () => {
      const schema = { type: "array", items: "string" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).schema).toEqual(schema);
        expect((result.data as Record<string, unknown>).summary).toContain(
          "schema type: array"
        );
      }
    });

    it("should fail for invalid base64", async () => {
      const result = await executeTool(avroViewer, {
        input: "not valid base64!!!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BASE64_DECODE_ERROR");
      }
    });

    it("should fail for empty data", async () => {
      const result = await executeTool(avroViewer, { input: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("AVRO_DECODE_ERROR");
      }
    });

    it("should handle truncated header gracefully", async () => {
      // Just magic bytes without metadata
      const input = toBase64([0x4f, 0x62, 0x6a, 0x01]);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("AVRO_DECODE_ERROR");
      }
    });

    it("should generate summary", async () => {
      const schema = { type: "string" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = await executeTool(avroViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).summary).toContain(
          "Avro Object Container File"
        );
        expect((result.data as Record<string, unknown>).summary).toContain(
          "codec: null"
        );
      }
    });

    it("should include execution metadata", async () => {
      const input = toBase64([0x01, 0x02, 0x03, 0x04]);
      const result = await executeTool(avroViewer, { input });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should decode when called directly", () => {
      const input = toBase64([0x01, 0x02, 0x03, 0x04]);
      const result = avroViewer.execute({ input }) as Record<string, unknown>;
      expect(result.isObjectContainer).toBe(false);
      expect(result.byteLength).toBe(4);
    });

    it("should detect Avro container when called directly", () => {
      const schema = { type: "string" };
      const bytes = createAvroContainerFile(schema);
      const input = toBase64(bytes);
      const result = avroViewer.execute({ input }) as Record<string, unknown>;
      expect(result.isObjectContainer).toBe(true);
      expect(result.schema).toEqual(schema);
    });
  });
});
