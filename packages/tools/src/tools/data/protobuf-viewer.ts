import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import {
  PROTOBUF_DECODE_ERROR,
  BASE64_DECODE_ERROR,
} from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Base64-encoded Protobuf binary data"),
});

/**
 * Wire type definitions for Protobuf.
 */
const wireTypeSchema = z.enum([
  "VARINT",
  "I64",
  "LEN",
  "SGROUP",
  "EGROUP",
  "I32",
]);

const fieldSchema = z.object({
  fieldNumber: z.number().describe("Field number from the tag"),
  wireType: wireTypeSchema.describe("Wire type of the field"),
  wireTypeName: z.string().describe("Human-readable wire type name"),
  rawValue: z.unknown().describe("Raw value decoded based on wire type"),
  possibleInterpretations: z
    .array(z.string())
    .describe("Possible interpretations of the value"),
});

const outputSchema = z.object({
  hex: z.string().describe("Hexadecimal representation of the binary data"),
  byteLength: z.number().describe("Length of the binary data in bytes"),
  fields: z.array(fieldSchema).describe("Decoded Protobuf fields"),
  summary: z.string().describe("Summary of the decoded data structure"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Field = z.infer<typeof fieldSchema>;

/**
 * Wire type names.
 */
const WIRE_TYPE_NAMES: Record<number, string> = {
  0: "VARINT",
  1: "I64 (64-bit)",
  2: "LEN (length-delimited)",
  3: "SGROUP (start group, deprecated)",
  4: "EGROUP (end group, deprecated)",
  5: "I32 (32-bit)",
};

/**
 * Decode a varint from the buffer.
 */
function decodeVarint(
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

  return { value: result, bytesRead };
}

/**
 * Decode a ZigZag-encoded signed varint.
 */
function decodeZigZag(value: bigint): bigint {
  return (value >> BigInt(1)) ^ -(value & BigInt(1));
}

/**
 * Try to interpret bytes as a UTF-8 string.
 */
function tryDecodeString(bytes: Uint8Array): string | null {
  try {
    const str = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Check if it's printable ASCII or common unicode
    if (/^[\x20-\x7E\u00A0-\uFFFF\s]*$/.test(str) && str.length > 0) {
      return str;
    }
  } catch {
    // Not valid UTF-8
  }
  return null;
}

/**
 * Try to decode embedded message recursively.
 */
function tryDecodeEmbeddedMessage(
  bytes: Uint8Array
): { fields: Field[] } | null {
  try {
    const fields = decodeProtobufFields(bytes);
    if (fields.length > 0) {
      return { fields };
    }
  } catch {
    // Not a valid embedded message
  }
  return null;
}

/**
 * Decode all Protobuf fields from the buffer.
 */
function decodeProtobufFields(buffer: Uint8Array): Field[] {
  const fields: Field[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    // Decode tag (field number + wire type)
    const tagResult = decodeVarint(buffer, offset);
    offset += tagResult.bytesRead;

    const tag = Number(tagResult.value);
    const wireType = tag & 0x07;
    const fieldNumber = tag >> 3;

    if (fieldNumber === 0) {
      throw new Error("Invalid field number 0");
    }

    const wireTypeName = WIRE_TYPE_NAMES[wireType] || `Unknown (${wireType})`;
    const possibleInterpretations: string[] = [];
    let rawValue: unknown;

    switch (wireType) {
      case 0: {
        // VARINT
        const varintResult = decodeVarint(buffer, offset);
        offset += varintResult.bytesRead;
        rawValue = varintResult.value.toString();

        // Add possible interpretations
        possibleInterpretations.push(`uint: ${varintResult.value.toString()}`);
        possibleInterpretations.push(
          `sint (zigzag): ${decodeZigZag(varintResult.value).toString()}`
        );
        if (varintResult.value === BigInt(0)) {
          possibleInterpretations.push("bool: false");
        } else if (varintResult.value === BigInt(1)) {
          possibleInterpretations.push("bool: true");
        }
        break;
      }

      case 1: {
        // I64 (64-bit fixed)
        if (offset + 8 > buffer.length) {
          throw new Error("Unexpected end of data for I64");
        }
        const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 8);
        const fixedBytes = buffer.slice(offset, offset + 8);
        offset += 8;

        rawValue = Array.from(fixedBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");

        possibleInterpretations.push(`fixed64: ${view.getBigUint64(0, true)}`);
        possibleInterpretations.push(`sfixed64: ${view.getBigInt64(0, true)}`);
        possibleInterpretations.push(`double: ${view.getFloat64(0, true)}`);
        break;
      }

      case 2: {
        // LEN (length-delimited)
        const lengthResult = decodeVarint(buffer, offset);
        offset += lengthResult.bytesRead;
        const length = Number(lengthResult.value);

        if (offset + length > buffer.length) {
          throw new Error("Unexpected end of data for length-delimited field");
        }

        const bytes = buffer.slice(offset, offset + length);
        offset += length;

        rawValue = Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");

        // Try string interpretation
        const strValue = tryDecodeString(bytes);
        if (strValue !== null) {
          possibleInterpretations.push(`string: "${strValue}"`);
        }

        // Try embedded message interpretation
        const embedded = tryDecodeEmbeddedMessage(bytes);
        if (embedded !== null) {
          possibleInterpretations.push(
            `embedded message: ${embedded.fields.length} fields`
          );
        }

        // Bytes interpretation
        possibleInterpretations.push(`bytes: ${length} bytes`);

        // Try packed repeated interpretation for numeric types
        if (bytes.length > 0) {
          try {
            const packedInts: bigint[] = [];
            let packedOffset = 0;
            while (packedOffset < bytes.length) {
              const vi = decodeVarint(bytes, packedOffset);
              packedInts.push(vi.value);
              packedOffset += vi.bytesRead;
            }
            if (packedInts.length > 1) {
              possibleInterpretations.push(
                `packed varints: [${packedInts.slice(0, 5).join(", ")}${packedInts.length > 5 ? ", ..." : ""}]`
              );
            }
          } catch {
            // Not packed varints
          }
        }
        break;
      }

      case 3: {
        // SGROUP (deprecated)
        rawValue = "start group";
        possibleInterpretations.push("deprecated group start");
        break;
      }

      case 4: {
        // EGROUP (deprecated)
        rawValue = "end group";
        possibleInterpretations.push("deprecated group end");
        break;
      }

      case 5: {
        // I32 (32-bit fixed)
        if (offset + 4 > buffer.length) {
          throw new Error("Unexpected end of data for I32");
        }
        const view32 = new DataView(
          buffer.buffer,
          buffer.byteOffset + offset,
          4
        );
        const fixed32Bytes = buffer.slice(offset, offset + 4);
        offset += 4;

        rawValue = Array.from(fixed32Bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");

        possibleInterpretations.push(`fixed32: ${view32.getUint32(0, true)}`);
        possibleInterpretations.push(`sfixed32: ${view32.getInt32(0, true)}`);
        possibleInterpretations.push(`float: ${view32.getFloat32(0, true)}`);
        break;
      }

      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }

    fields.push({
      fieldNumber,
      wireType: WIRE_TYPE_NAMES[wireType]?.split(" ")[0] as Field["wireType"],
      wireTypeName,
      rawValue,
      possibleInterpretations,
    });
  }

  return fields;
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
 * View Protobuf binary data structure (basic wire format parsing).
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
      code: PROTOBUF_DECODE_ERROR,
      message: "Empty Protobuf data",
    });
  }

  // Decode fields
  let fields: Field[];
  try {
    fields = decodeProtobufFields(buffer);
  } catch (err) {
    throw createToolError({
      code: PROTOBUF_DECODE_ERROR,
      message: `Failed to decode Protobuf: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  // Generate summary
  const wireTypeCounts: Record<string, number> = {};
  for (const field of fields) {
    wireTypeCounts[field.wireTypeName] =
      (wireTypeCounts[field.wireTypeName] || 0) + 1;
  }

  const summary = `${fields.length} fields decoded: ${Object.entries(
    wireTypeCounts
  )
    .map(([type, count]) => `${count} ${type}`)
    .join(", ")}`;

  return {
    hex: toHex(buffer),
    byteLength: buffer.length,
    fields,
    summary,
  };
}

/**
 * Protobuf Viewer tool.
 * View Protobuf binary data structure (basic wire format parsing).
 */
export const protobufViewer = defineTool({
  meta: {
    id: "data/protobuf-viewer",
    name: "Protobuf Viewer",
    description:
      "Free online Protobuf viewer — decode and inspect Protocol Buffer binary wire format data instantly in your browser. No data is stored. Parses field tags, wire types (varint, length-delimited, fixed32/64), and shows possible value interpretations.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "protobuf",
      "protocol buffers",
      "binary",
      "decode",
      "viewer",
      "hex",
      "base64",
      "wire format",
      "grpc",
      "inspect",
    ],
    examples: [
      {
        title: "User message with id (varint) and name (string)",
        description:
          "Decode base64-encoded Protobuf wire format data with field interpretation",
        input: "CAESBUFsaWNl",
        output:
          '{\n  "hex": "08 01 12 05 41 6c 69 63 65",\n  "byteLength": 9,\n  "fields": [\n    {\n      "fieldNumber": 1,\n      "wireType": "VARINT",\n      "wireTypeName": "VARINT",\n      "rawValue": "1",\n      "possibleInterpretations": [\n        "uint: 1",\n        "sint (zigzag): -1",\n        "bool: true"\n      ]\n    },\n    {\n      "fieldNumber": 2,\n      "wireType": "LEN",\n      "wireTypeName": "LEN (length-delimited)",\n      "rawValue": "41 6c 69 63 65",\n      "possibleInterpretations": [\n        "string: \\"Alice\\"",\n        "bytes: 5 bytes",\n        "packed varints: [65, 108, 105, 99, 101]"\n      ]\n    }\n  ],\n  "summary": "2 fields decoded: 1 VARINT, 1 LEN (length-delimited)"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
