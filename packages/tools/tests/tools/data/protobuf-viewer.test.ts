import { describe, it, expect } from "vitest";
import { protobufViewer } from "../../../src/tools/data/protobuf-viewer";
import { executeTool } from "../../../src/core/executor";
import { ToolTier } from "../../../src/types";

interface ProtobufField {
  fieldNumber: number;
  wireType: string;
  wireTypeName: string;
  rawValue: unknown;
  possibleInterpretations: string[];
}

interface ProtobufViewerOutput {
  hex: string;
  byteLength: number;
  fields: ProtobufField[];
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

describe("protobufViewer", () => {
  describe("metadata", () => {
    it("should have correct id", () => {
      expect(protobufViewer.meta.id).toBe("data/protobuf-viewer");
    });

    it("should have correct name", () => {
      expect(protobufViewer.meta.name).toBe("Protobuf Viewer");
    });

    it("should be in data category", () => {
      expect(protobufViewer.meta.category).toBe("data");
    });

    it("should be CLIENT tier", () => {
      expect(protobufViewer.meta.tier).toBe(ToolTier.CLIENT);
    });

    it("should have relevant keywords", () => {
      expect(protobufViewer.meta.keywords).toContain("protobuf");
      expect(protobufViewer.meta.keywords).toContain("protocol buffers");
      expect(protobufViewer.meta.keywords).toContain("wire format");
    });
  });

  describe("execute", () => {
    it("should decode varint field", async () => {
      // Field 1, wire type 0 (VARINT), value 150
      // Tag: (1 << 3) | 0 = 0x08
      // Value: 150 = 0x96 0x01 (varint encoding)
      const input = toBase64([0x08, 0x96, 0x01]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(1);
        const field = data.fields[0];
        if (field) {
          expect(field.fieldNumber).toBe(1);
          expect(field.wireType).toBe("VARINT");
          expect(field.rawValue).toBe("150");
        }
        expect(data.byteLength).toBe(3);
      }
    });

    it("should decode length-delimited field (string)", async () => {
      // Field 2, wire type 2 (LEN), value "testing"
      // Tag: (2 << 3) | 2 = 0x12
      // Length: 7
      // Value: "testing"
      const input = toBase64([
        0x12, 0x07, 0x74, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x67,
      ]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(1);
        const field = data.fields[0];
        if (field) {
          expect(field.fieldNumber).toBe(2);
          expect(field.wireType).toBe("LEN");
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("testing")
          );
        }
      }
    });

    it("should decode fixed32 field", async () => {
      // Field 3, wire type 5 (I32), value 0x01020304
      // Tag: (3 << 3) | 5 = 0x1d
      const input = toBase64([0x1d, 0x04, 0x03, 0x02, 0x01]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(1);
        const field = data.fields[0];
        if (field) {
          expect(field.fieldNumber).toBe(3);
          expect(field.wireType).toBe("I32");
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("fixed32")
          );
        }
      }
    });

    it("should decode fixed64 field", async () => {
      // Field 4, wire type 1 (I64)
      // Tag: (4 << 3) | 1 = 0x21
      const input = toBase64([
        0x21, 0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01,
      ]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(1);
        const field = data.fields[0];
        if (field) {
          expect(field.fieldNumber).toBe(4);
          expect(field.wireType).toBe("I64");
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("fixed64")
          );
        }
      }
    });

    it("should decode multiple fields", async () => {
      // Field 1, VARINT, value 1
      // Field 2, VARINT, value 2
      const input = toBase64([0x08, 0x01, 0x10, 0x02]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(2);
        const field0 = data.fields[0];
        const field1 = data.fields[1];
        if (field0 && field1) {
          expect(field0.fieldNumber).toBe(1);
          expect(field1.fieldNumber).toBe(2);
        }
        expect(data.summary).toContain("2 fields decoded");
      }
    });

    it("should provide zigzag interpretation for varints", async () => {
      // Field 1, VARINT, value 1 (zigzag: -1)
      const input = toBase64([0x08, 0x01]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        const field = data.fields[0];
        if (field) {
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("sint")
          );
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("zigzag")
          );
        }
      }
    });

    it("should provide boolean interpretation for 0 and 1 varints", async () => {
      // Field 1, VARINT, value 0 (could be bool false)
      const input = toBase64([0x08, 0x00]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        const field = data.fields[0];
        if (field) {
          expect(field.possibleInterpretations).toContainEqual("bool: false");
        }
      }
    });

    it("should return hex representation", async () => {
      const input = toBase64([0x08, 0x01]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.hex).toBe("08 01");
      }
    });

    it("should decode empty bytes field", async () => {
      // Field 2, LEN, length 0
      const input = toBase64([0x12, 0x00]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        expect(data.fields).toHaveLength(1);
        const field = data.fields[0];
        if (field) {
          expect(field.wireType).toBe("LEN");
          expect(field.possibleInterpretations).toContainEqual(
            "bytes: 0 bytes"
          );
        }
      }
    });

    it("should try to decode packed repeated fields", async () => {
      // Field 1, LEN, packed varints [1, 2, 3]
      const input = toBase64([0x0a, 0x03, 0x01, 0x02, 0x03]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        const data = result.data as ProtobufViewerOutput;
        const field = data.fields[0];
        if (field) {
          expect(field.possibleInterpretations).toContainEqual(
            expect.stringContaining("packed varints")
          );
        }
      }
    });

    it("should fail for invalid base64", async () => {
      const result = await executeTool(protobufViewer, {
        input: "not valid base64!!!",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("BASE64_DECODE_ERROR");
      }
    });

    it("should fail for empty data", async () => {
      const result = await executeTool(protobufViewer, { input: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PROTOBUF_DECODE_ERROR");
      }
    });

    it("should fail for truncated length-delimited field", async () => {
      // Field 2, LEN, length 10, but only 2 bytes of data
      const input = toBase64([0x12, 0x0a, 0x01, 0x02]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PROTOBUF_DECODE_ERROR");
      }
    });

    it("should generate summary", async () => {
      const input = toBase64([0x08, 0x01, 0x12, 0x02, 0x61, 0x62]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).summary).toContain(
          "2 fields decoded"
        );
        expect((result.data as Record<string, unknown>).summary).toContain(
          "VARINT"
        );
        expect((result.data as Record<string, unknown>).summary).toContain(
          "LEN"
        );
      }
    });

    it("should include execution metadata", async () => {
      const input = toBase64([0x08, 0x01]);
      const result = await executeTool(protobufViewer, { input });

      expect(result.meta).toBeDefined();
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
    });
  });

  describe("execute function directly", () => {
    it("should decode when called directly", () => {
      const input = toBase64([0x08, 0x01]);
      const result = protobufViewer.execute({ input }) as ProtobufViewerOutput;
      expect(result.fields).toHaveLength(1);
      const field = result.fields[0];
      if (field) {
        expect(field.fieldNumber).toBe(1);
      }
    });
  });
});
