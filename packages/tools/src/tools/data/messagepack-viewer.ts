import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import {
  MESSAGEPACK_DECODE_ERROR,
  BASE64_DECODE_ERROR,
} from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Base64-encoded MessagePack binary data"),
});

const outputSchema = z.object({
  hex: z.string().describe("Hexadecimal representation of the binary data"),
  decoded: z.unknown().describe("Decoded JSON value from MessagePack"),
  byteLength: z.number().describe("Length of the binary data in bytes"),
  format: z.string().describe("MessagePack format description"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * MessagePack format types based on the first byte.
 */
function getMessagePackFormatInfo(firstByte: number): string {
  // Positive fixint: 0x00 - 0x7f
  if (firstByte <= 0x7f) {
    return `Positive fixint (value: ${firstByte})`;
  }
  // Fixmap: 0x80 - 0x8f
  if (firstByte >= 0x80 && firstByte <= 0x8f) {
    return `Fixmap (${firstByte - 0x80} elements)`;
  }
  // Fixarray: 0x90 - 0x9f
  if (firstByte >= 0x90 && firstByte <= 0x9f) {
    return `Fixarray (${firstByte - 0x90} elements)`;
  }
  // Fixstr: 0xa0 - 0xbf
  if (firstByte >= 0xa0 && firstByte <= 0xbf) {
    return `Fixstr (${firstByte - 0xa0} bytes)`;
  }
  // Nil: 0xc0
  if (firstByte === 0xc0) {
    return "Nil";
  }
  // Never used: 0xc1
  if (firstByte === 0xc1) {
    return "Never used (0xc1)";
  }
  // Boolean: 0xc2 (false), 0xc3 (true)
  if (firstByte === 0xc2) {
    return "Boolean (false)";
  }
  if (firstByte === 0xc3) {
    return "Boolean (true)";
  }
  // Binary formats: 0xc4 - 0xc6
  if (firstByte === 0xc4) {
    return "Bin8";
  }
  if (firstByte === 0xc5) {
    return "Bin16";
  }
  if (firstByte === 0xc6) {
    return "Bin32";
  }
  // Extension formats: 0xc7 - 0xc9
  if (firstByte === 0xc7) {
    return "Ext8";
  }
  if (firstByte === 0xc8) {
    return "Ext16";
  }
  if (firstByte === 0xc9) {
    return "Ext32";
  }
  // Float formats: 0xca (float32), 0xcb (float64)
  if (firstByte === 0xca) {
    return "Float32";
  }
  if (firstByte === 0xcb) {
    return "Float64";
  }
  // Unsigned int formats: 0xcc - 0xcf
  if (firstByte === 0xcc) {
    return "Uint8";
  }
  if (firstByte === 0xcd) {
    return "Uint16";
  }
  if (firstByte === 0xce) {
    return "Uint32";
  }
  if (firstByte === 0xcf) {
    return "Uint64";
  }
  // Signed int formats: 0xd0 - 0xd3
  if (firstByte === 0xd0) {
    return "Int8";
  }
  if (firstByte === 0xd1) {
    return "Int16";
  }
  if (firstByte === 0xd2) {
    return "Int32";
  }
  if (firstByte === 0xd3) {
    return "Int64";
  }
  // Fixext formats: 0xd4 - 0xd8
  if (firstByte === 0xd4) {
    return "Fixext1";
  }
  if (firstByte === 0xd5) {
    return "Fixext2";
  }
  if (firstByte === 0xd6) {
    return "Fixext4";
  }
  if (firstByte === 0xd7) {
    return "Fixext8";
  }
  if (firstByte === 0xd8) {
    return "Fixext16";
  }
  // String formats: 0xd9 - 0xdb
  if (firstByte === 0xd9) {
    return "Str8";
  }
  if (firstByte === 0xda) {
    return "Str16";
  }
  if (firstByte === 0xdb) {
    return "Str32";
  }
  // Array formats: 0xdc - 0xdd
  if (firstByte === 0xdc) {
    return "Array16";
  }
  if (firstByte === 0xdd) {
    return "Array32";
  }
  // Map formats: 0xde - 0xdf
  if (firstByte === 0xde) {
    return "Map16";
  }
  if (firstByte === 0xdf) {
    return "Map32";
  }
  // Negative fixint: 0xe0 - 0xff
  if (firstByte >= 0xe0) {
    return `Negative fixint (value: ${firstByte - 256})`;
  }
  return "Unknown format";
}

/**
 * Basic MessagePack decoder that handles common types.
 */
function decodeMessagePack(
  buffer: Uint8Array,
  offset = 0
): { value: unknown; bytesRead: number } {
  if (offset >= buffer.length) {
    throw new Error("Unexpected end of data");
  }

  const firstByte = buffer[offset];
  if (firstByte === undefined) {
    throw new Error("Unexpected end of data");
  }

  // Positive fixint: 0x00 - 0x7f
  if (firstByte <= 0x7f) {
    return { value: firstByte, bytesRead: 1 };
  }

  // Fixmap: 0x80 - 0x8f
  if (firstByte >= 0x80 && firstByte <= 0x8f) {
    const size = firstByte - 0x80;
    const result: Record<string, unknown> = {};
    let bytesRead = 1;
    for (let i = 0; i < size; i++) {
      const key = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += key.bytesRead;
      const val = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += val.bytesRead;
      result[String(key.value)] = val.value;
    }
    return { value: result, bytesRead };
  }

  // Fixarray: 0x90 - 0x9f
  if (firstByte >= 0x90 && firstByte <= 0x9f) {
    const size = firstByte - 0x90;
    const result: unknown[] = [];
    let bytesRead = 1;
    for (let i = 0; i < size; i++) {
      const item = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += item.bytesRead;
      result.push(item.value);
    }
    return { value: result, bytesRead };
  }

  // Fixstr: 0xa0 - 0xbf
  if (firstByte >= 0xa0 && firstByte <= 0xbf) {
    const size = firstByte - 0xa0;
    const strBytes = buffer.slice(offset + 1, offset + 1 + size);
    const value = new TextDecoder().decode(strBytes);
    return { value, bytesRead: 1 + size };
  }

  // Nil: 0xc0
  if (firstByte === 0xc0) {
    return { value: null, bytesRead: 1 };
  }

  // Boolean: 0xc2 (false), 0xc3 (true)
  if (firstByte === 0xc2) {
    return { value: false, bytesRead: 1 };
  }
  if (firstByte === 0xc3) {
    return { value: true, bytesRead: 1 };
  }

  // Float32: 0xca
  if (firstByte === 0xca) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    return { value: view.getFloat32(0, false), bytesRead: 5 };
  }

  // Float64: 0xcb
  if (firstByte === 0xcb) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 8);
    return { value: view.getFloat64(0, false), bytesRead: 9 };
  }

  // Uint8: 0xcc
  if (firstByte === 0xcc) {
    return { value: buffer[offset + 1], bytesRead: 2 };
  }

  // Uint16: 0xcd
  if (firstByte === 0xcd) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    return { value: view.getUint16(0, false), bytesRead: 3 };
  }

  // Uint32: 0xce
  if (firstByte === 0xce) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    return { value: view.getUint32(0, false), bytesRead: 5 };
  }

  // Uint64: 0xcf — decoded as number (safe) or string (if > Number.MAX_SAFE_INTEGER)
  if (firstByte === 0xcf) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 8);
    const big = view.getBigUint64(0, false);
    const value =
      big <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(big) : big.toString();
    return { value, bytesRead: 9 };
  }

  // Bin8: 0xc4 — binary data returned as hex string
  if (firstByte === 0xc4) {
    const size = buffer[offset + 1];
    if (size === undefined) {
      throw new Error("Unexpected end of data for Bin8 length");
    }
    const bytes = buffer.slice(offset + 2, offset + 2 + size);
    const value = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { value, bytesRead: 2 + size };
  }

  // Bin16: 0xc5 — binary data returned as hex string
  if (firstByte === 0xc5) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    const size = view.getUint16(0, false);
    const bytes = buffer.slice(offset + 3, offset + 3 + size);
    const value = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { value, bytesRead: 3 + size };
  }

  // Bin32: 0xc6 — binary data returned as hex string
  if (firstByte === 0xc6) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    const size = view.getUint32(0, false);
    const bytes = buffer.slice(offset + 5, offset + 5 + size);
    const value = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { value, bytesRead: 5 + size };
  }

  // Int8: 0xd0
  if (firstByte === 0xd0) {
    const val = buffer[offset + 1];
    if (val === undefined) {
      throw new Error("Unexpected end of data for Int8");
    }
    return { value: val > 127 ? val - 256 : val, bytesRead: 2 };
  }

  // Int16: 0xd1
  if (firstByte === 0xd1) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    return { value: view.getInt16(0, false), bytesRead: 3 };
  }

  // Int32: 0xd2
  if (firstByte === 0xd2) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    return { value: view.getInt32(0, false), bytesRead: 5 };
  }

  // Int64: 0xd3 — decoded as number (safe) or string (if outside safe range)
  if (firstByte === 0xd3) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 8);
    const big = view.getBigInt64(0, false);
    const value =
      big >= BigInt(Number.MIN_SAFE_INTEGER) &&
      big <= BigInt(Number.MAX_SAFE_INTEGER)
        ? Number(big)
        : big.toString();
    return { value, bytesRead: 9 };
  }

  // Str8: 0xd9
  if (firstByte === 0xd9) {
    const size = buffer[offset + 1];
    if (size === undefined) {
      throw new Error("Unexpected end of data for Str8 length");
    }
    const strBytes = buffer.slice(offset + 2, offset + 2 + size);
    const value = new TextDecoder().decode(strBytes);
    return { value, bytesRead: 2 + size };
  }

  // Str16: 0xda
  if (firstByte === 0xda) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    const size = view.getUint16(0, false);
    const strBytes = buffer.slice(offset + 3, offset + 3 + size);
    const value = new TextDecoder().decode(strBytes);
    return { value, bytesRead: 3 + size };
  }

  // Str32: 0xdb
  if (firstByte === 0xdb) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    const size = view.getUint32(0, false);
    const strBytes = buffer.slice(offset + 5, offset + 5 + size);
    const value = new TextDecoder().decode(strBytes);
    return { value, bytesRead: 5 + size };
  }

  // Array16: 0xdc
  if (firstByte === 0xdc) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    const size = view.getUint16(0, false);
    const result: unknown[] = [];
    let bytesRead = 3;
    for (let i = 0; i < size; i++) {
      const item = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += item.bytesRead;
      result.push(item.value);
    }
    return { value: result, bytesRead };
  }

  // Array32: 0xdd
  if (firstByte === 0xdd) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    const size = view.getUint32(0, false);
    const result: unknown[] = [];
    let bytesRead = 5;
    for (let i = 0; i < size; i++) {
      const item = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += item.bytesRead;
      result.push(item.value);
    }
    return { value: result, bytesRead };
  }

  // Map16: 0xde
  if (firstByte === 0xde) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 2);
    const size = view.getUint16(0, false);
    const result: Record<string, unknown> = {};
    let bytesRead = 3;
    for (let i = 0; i < size; i++) {
      const key = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += key.bytesRead;
      const val = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += val.bytesRead;
      result[String(key.value)] = val.value;
    }
    return { value: result, bytesRead };
  }

  // Map32: 0xdf
  if (firstByte === 0xdf) {
    const view = new DataView(buffer.buffer, buffer.byteOffset + offset + 1, 4);
    const size = view.getUint32(0, false);
    const result: Record<string, unknown> = {};
    let bytesRead = 5;
    for (let i = 0; i < size; i++) {
      const key = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += key.bytesRead;
      const val = decodeMessagePack(buffer, offset + bytesRead);
      bytesRead += val.bytesRead;
      result[String(key.value)] = val.value;
    }
    return { value: result, bytesRead };
  }

  // Negative fixint: 0xe0 - 0xff
  if (firstByte >= 0xe0) {
    return { value: firstByte - 256, bytesRead: 1 };
  }

  throw new Error(
    `Unsupported MessagePack format: 0x${firstByte.toString(16)}`
  );
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
 * View/decode MessagePack binary data.
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
      code: MESSAGEPACK_DECODE_ERROR,
      message: "Empty MessagePack data",
    });
  }

  // Get format info from first byte
  const firstByte = buffer[0];
  if (firstByte === undefined) {
    throw createToolError({
      code: MESSAGEPACK_DECODE_ERROR,
      message: "Empty MessagePack data",
    });
  }
  const format = getMessagePackFormatInfo(firstByte);

  // Attempt to decode
  let decoded: unknown;
  try {
    const result = decodeMessagePack(buffer);
    decoded = result.value;
  } catch (err) {
    throw createToolError({
      code: MESSAGEPACK_DECODE_ERROR,
      message: `Failed to decode MessagePack: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  return {
    hex: toHex(buffer),
    decoded,
    byteLength: buffer.length,
    format,
  };
}

/**
 * MessagePack Viewer tool.
 * View/decode MessagePack binary data (display as hex + decoded JSON).
 */
export const messagepackViewer = defineTool({
  meta: {
    id: "data/messagepack-viewer",
    name: "MessagePack Viewer",
    description:
      "Free online MessagePack viewer — decode and inspect MessagePack binary data instantly in your browser. No data is stored. Decodes base64-encoded msgpack to JSON with hex dump, format type identification, and byte length.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "messagepack",
      "msgpack",
      "binary",
      "decode",
      "viewer",
      "hex",
      "base64",
      "serialization",
      "inspect",
    ],
    examples: [
      {
        title: "Decode fixmap with string key-value pair",
        description:
          'Decode a base64-encoded MessagePack map containing {"name":"Alice"}',
        input: "gaRuYW1lpUFsaWNl",
        output:
          '{\n  "hex": "81 a4 6e 61 6d 65 a5 41 6c 69 63 65",\n  "decoded": {\n    "name": "Alice"\n  },\n  "byteLength": 12,\n  "format": "Fixmap (1 elements)"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
