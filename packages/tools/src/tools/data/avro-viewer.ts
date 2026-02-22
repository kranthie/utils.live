import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { AVRO_DECODE_ERROR, BASE64_DECODE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Base64-encoded Avro binary data"),
});

const outputSchema = z.object({
  hex: z.string().describe("Hexadecimal representation of the binary data"),
  byteLength: z.number().describe("Length of the binary data in bytes"),
  isObjectContainer: z
    .boolean()
    .describe("Whether the data appears to be an Avro Object Container File"),
  header: z
    .object({
      magic: z.string().describe("Magic bytes (Obj1 for valid Avro files)"),
      metadata: z
        .record(z.string(), z.string())
        .describe("File metadata including schema"),
      syncMarker: z.string().describe("16-byte sync marker in hex"),
    })
    .optional()
    .describe("Avro file header if present"),
  schema: z.unknown().optional().describe("Parsed Avro schema if available"),
  blocks: z
    .array(
      z.object({
        objectCount: z.number().describe("Number of objects in the block"),
        compressedSize: z.number().describe("Size of the block data in bytes"),
        dataPreview: z
          .string()
          .describe("Hex preview of block data (first 64 bytes)"),
      })
    )
    .optional()
    .describe("Data blocks if present"),
  summary: z.string().describe("Summary of the Avro data structure"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Avro magic bytes: "Obj" + 0x01
 */
const AVRO_MAGIC = new Uint8Array([0x4f, 0x62, 0x6a, 0x01]);

/**
 * Decode a varint (zigzag-encoded long) from Avro binary format.
 */
function decodeAvroVarint(
  buffer: Uint8Array,
  offset: number
): { value: bigint; bytesRead: number } {
  let result = BigInt(0);
  let shift = BigInt(0);
  let bytesRead = 0;

  while (offset + bytesRead < buffer.length) {
    const byte = buffer[offset + bytesRead];
    if (byte === undefined) {
      throw new Error("Unexpected end of buffer");
    }
    bytesRead++;

    result |= BigInt(byte & 0x7f) << shift;
    shift += BigInt(7);

    if ((byte & 0x80) === 0) {
      break;
    }

    if (bytesRead > 10) {
      throw new Error("Varint too long");
    }
  }

  // Zigzag decode
  const zigzag = (result >> BigInt(1)) ^ -(result & BigInt(1));
  return { value: zigzag, bytesRead };
}

/**
 * Decode an Avro string (length-prefixed).
 */
function decodeAvroString(
  buffer: Uint8Array,
  offset: number
): { value: string; bytesRead: number } {
  const lengthResult = decodeAvroVarint(buffer, offset);
  const length = Number(lengthResult.value);

  if (length < 0) {
    throw new Error("Negative string length");
  }

  const strOffset = offset + lengthResult.bytesRead;
  if (strOffset + length > buffer.length) {
    throw new Error("Unexpected end of data for string");
  }

  const strBytes = buffer.slice(strOffset, strOffset + length);
  const value = new TextDecoder().decode(strBytes);

  return { value, bytesRead: lengthResult.bytesRead + length };
}

/**
 * Decode Avro bytes (length-prefixed).
 */
function decodeAvroBytes(
  buffer: Uint8Array,
  offset: number
): { value: Uint8Array; bytesRead: number } {
  const lengthResult = decodeAvroVarint(buffer, offset);
  const length = Number(lengthResult.value);

  if (length < 0) {
    throw new Error("Negative bytes length");
  }

  const dataOffset = offset + lengthResult.bytesRead;
  if (dataOffset + length > buffer.length) {
    throw new Error("Unexpected end of data for bytes");
  }

  const value = buffer.slice(dataOffset, dataOffset + length);
  return { value, bytesRead: lengthResult.bytesRead + length };
}

/**
 * Decode Avro map of strings.
 */
function decodeAvroMapOfStrings(
  buffer: Uint8Array,
  offset: number
): { value: Record<string, string>; bytesRead: number } {
  const result: Record<string, string> = {};
  let currentOffset = offset;
  let totalBytesRead = 0;

  while (true) {
    // Read block count
    const countResult = decodeAvroVarint(buffer, currentOffset);
    currentOffset += countResult.bytesRead;
    totalBytesRead += countResult.bytesRead;

    const count = Number(countResult.value);

    // Zero count indicates end of map
    if (count === 0) {
      break;
    }

    // Negative count means the block size follows (we skip it)
    const actualCount = count < 0 ? -count : count;

    if (count < 0) {
      // Skip block size
      const blockSizeResult = decodeAvroVarint(buffer, currentOffset);
      currentOffset += blockSizeResult.bytesRead;
      totalBytesRead += blockSizeResult.bytesRead;
    }

    // Read key-value pairs
    for (let i = 0; i < actualCount; i++) {
      const keyResult = decodeAvroString(buffer, currentOffset);
      currentOffset += keyResult.bytesRead;
      totalBytesRead += keyResult.bytesRead;

      const valueResult = decodeAvroBytes(buffer, currentOffset);
      currentOffset += valueResult.bytesRead;
      totalBytesRead += valueResult.bytesRead;

      // Try to decode the value as UTF-8 string
      try {
        result[keyResult.value] = new TextDecoder().decode(valueResult.value);
      } catch {
        result[keyResult.value] = `<${valueResult.value.length} bytes>`;
      }
    }
  }

  return { value: result, bytesRead: totalBytesRead };
}

/**
 * Converts a Uint8Array to a hex string.
 */
function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

/**
 * Check if buffer starts with Avro magic bytes.
 */
function hasAvroMagic(buffer: Uint8Array): boolean {
  if (buffer.length < 4) {
    return false;
  }
  for (let i = 0; i < 4; i++) {
    if (buffer[i] !== AVRO_MAGIC[i]) {
      return false;
    }
  }
  return true;
}

/**
 * View Avro data structure (basic schema + data display).
 */
function execute(input: Input): Output {
  // Decode base64 input
  let buffer: Uint8Array;
  try {
    const binaryString = atob(input.input);
    buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }
  } catch (err) {
    throw createToolError({
      code: BASE64_DECODE_ERROR,
      message: `Invalid base64 input: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  if (buffer.length === 0) {
    throw createToolError({
      code: AVRO_DECODE_ERROR,
      message: "Empty Avro data",
    });
  }

  const hex = toHex(buffer);
  const byteLength = buffer.length;
  const isObjectContainer = hasAvroMagic(buffer);

  if (!isObjectContainer) {
    // Not an Avro Object Container File - just show basic info
    return {
      hex,
      byteLength,
      isObjectContainer: false,
      summary: `${byteLength} bytes of data (not an Avro Object Container File - may be raw Avro data without header)`,
    };
  }

  // Parse Avro Object Container File header
  let offset = 4; // Skip magic bytes

  // Decode metadata map
  let metadata: Record<string, string>;
  let schema: unknown;
  try {
    const metadataResult = decodeAvroMapOfStrings(buffer, offset);
    metadata = metadataResult.value;
    offset += metadataResult.bytesRead;

    // Try to parse schema from metadata
    if (metadata["avro.schema"]) {
      try {
        schema = JSON.parse(metadata["avro.schema"]);
      } catch {
        // Schema is not valid JSON
      }
    }
  } catch (err) {
    throw createToolError({
      code: AVRO_DECODE_ERROR,
      message: `Failed to decode Avro metadata: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  // Read 16-byte sync marker
  if (offset + 16 > buffer.length) {
    throw createToolError({
      code: AVRO_DECODE_ERROR,
      message: "Unexpected end of data for sync marker",
    });
  }

  const syncMarker = buffer.slice(offset, offset + 16);
  offset += 16;

  // Try to parse data blocks
  const blocks: Array<{
    objectCount: number;
    compressedSize: number;
    dataPreview: string;
  }> = [];

  try {
    while (offset < buffer.length) {
      // Read object count in this block
      const countResult = decodeAvroVarint(buffer, offset);
      offset += countResult.bytesRead;
      const objectCount = Number(countResult.value);

      // Read compressed block size
      const sizeResult = decodeAvroVarint(buffer, offset);
      offset += sizeResult.bytesRead;
      const compressedSize = Number(sizeResult.value);

      if (compressedSize < 0 || offset + compressedSize > buffer.length) {
        break; // Invalid or truncated data
      }

      // Get data preview (first 64 bytes max)
      const previewSize = Math.min(compressedSize, 64);
      const dataPreview = toHex(buffer.slice(offset, offset + previewSize));

      blocks.push({
        objectCount,
        compressedSize,
        dataPreview:
          previewSize < compressedSize ? dataPreview + " ..." : dataPreview,
      });

      offset += compressedSize;

      // Skip sync marker between blocks
      if (offset + 16 <= buffer.length) {
        // Verify sync marker matches
        let syncMatches = true;
        for (let i = 0; i < 16 && syncMatches; i++) {
          if (buffer[offset + i] !== syncMarker[i]) {
            syncMatches = false;
          }
        }
        if (syncMatches) {
          offset += 16;
        } else {
          break; // End of blocks or corrupted data
        }
      }
    }
  } catch {
    // Failed to parse blocks - continue with what we have
  }

  const header = {
    magic: "Obj\\x01",
    metadata,
    syncMarker: toHex(syncMarker),
  };

  const schemaType =
    typeof schema === "object" && schema !== null && "type" in schema
      ? String((schema as Record<string, unknown>).type)
      : "unknown";

  const codec = metadata["avro.codec"] || "null";
  const totalObjects = blocks.reduce((sum, b) => sum + b.objectCount, 0);

  const summary = `Avro Object Container File: ${blocks.length} block(s), ${totalObjects} object(s), schema type: ${schemaType}, codec: ${codec}`;

  return {
    hex,
    byteLength,
    isObjectContainer: true,
    header,
    schema,
    blocks: blocks.length > 0 ? blocks : undefined,
    summary,
  };
}

/**
 * Avro Viewer tool.
 * View Avro data structure (basic schema + data display).
 */
export const avroViewer = defineTool({
  meta: {
    id: "data/avro-viewer",
    name: "Avro Viewer",
    description:
      "Free online Avro viewer — inspect base64-encoded Avro binary data instantly in your browser. No data is stored. Detects Object Container Files, parses headers, schemas, sync markers, and data blocks with hex preview.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "avro",
      "binary",
      "decode",
      "viewer",
      "hex",
      "base64",
      "schema",
      "apache",
      "kafka",
      "data-serialization",
      "inspect",
      "object-container",
    ],
    examples: [
      {
        title: "Inspect raw Avro binary bytes",
        description:
          "View hex dump and byte length of base64-encoded binary data",
        input: "AQID",
        output:
          '{\n  "hex": "01 02 03",\n  "byteLength": 3,\n  "isObjectContainer": false,\n  "summary": "3 bytes of data (not an Avro Object Container File - may be raw Avro data without header)"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
