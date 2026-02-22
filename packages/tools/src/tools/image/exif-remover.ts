import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JPEG or PNG image data as base64 or data URL"),
});
const outputSchema = z.object({
  output: z
    .string()
    .describe("Image with EXIF metadata removed (base64 data URL)"),
});

/**
 * Strip EXIF/APP markers from JPEG binary data.
 * JPEG structure: SOI (FFD8) followed by segments.
 * We keep SOI, strip all APPn (FFE0-FFEF) and COM (FFFE) segments,
 * and keep everything else (DQT, DHT, SOF, SOS, image data, EOI).
 */
function stripJpegExif(data: Uint8Array): Uint8Array {
  // Verify JPEG SOI marker
  if (data[0] !== 0xff || data[1] !== 0xd8) {
    throw new Error("Not a valid JPEG file");
  }

  const result: number[] = [0xff, 0xd8]; // SOI
  let offset = 2;

  while (offset < data.length - 1) {
    // Find next marker
    if (data[offset] !== 0xff) {
      // We've hit raw image data (after SOS), copy the rest
      for (let i = offset; i < data.length; i++) {
        result.push(data[i]!);
      }
      break;
    }

    const marker = data[offset + 1]!;

    // SOS (Start of Scan) - FFD9 follows image data
    // After SOS marker + its segment, the rest is compressed image data until EOI
    if (marker === 0xda) {
      // Copy SOS marker and its segment, plus all remaining data (image data + EOI)
      for (let i = offset; i < data.length; i++) {
        result.push(data[i]!);
      }
      break;
    }

    // EOI marker (FFD9) - no length
    if (marker === 0xd9) {
      result.push(0xff, 0xd9);
      break;
    }

    // Markers without length (RST0-RST7, SOI, TEM)
    if (
      (marker >= 0xd0 && marker <= 0xd7) ||
      marker === 0xd8 ||
      marker === 0x01
    ) {
      result.push(0xff, marker);
      offset += 2;
      continue;
    }

    // Read segment length (big-endian, includes the 2 length bytes)
    if (offset + 3 >= data.length) break;
    const segLen = (data[offset + 2]! << 8) | data[offset + 3]!;
    if (segLen < 2) break;

    // APPn markers (FFE0-FFEF) and COM (FFFE) - strip these
    if ((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe) {
      offset += 2 + segLen;
      continue;
    }

    // Keep all other segments (DQT, DHT, SOF, etc.)
    for (let i = 0; i < 2 + segLen; i++) {
      if (offset + i < data.length) {
        result.push(data[offset + i]!);
      }
    }
    offset += 2 + segLen;
  }

  return new Uint8Array(result);
}

/**
 * Strip text metadata chunks from PNG binary data.
 * PNG structure: 8-byte signature + chunks.
 * We strip tEXt, iTXt, zTXt, eXIf chunks.
 */
function stripPngMetadata(data: Uint8Array): Uint8Array {
  // Verify PNG signature
  const pngSig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (data[i] !== pngSig[i]) {
      throw new Error("Not a valid PNG file");
    }
  }

  const metadataChunks = new Set(["tEXt", "iTXt", "zTXt", "eXIf"]);
  const result: number[] = [];

  // Copy signature
  for (let i = 0; i < 8; i++) {
    result.push(data[i]!);
  }

  let offset = 8;
  while (offset < data.length) {
    if (offset + 8 > data.length) break;

    // Read chunk length (big-endian 4 bytes)
    const chunkLen =
      ((data[offset]! << 24) >>> 0) |
      (data[offset + 1]! << 16) |
      (data[offset + 2]! << 8) |
      data[offset + 3]!;

    // Read chunk type (4 ASCII chars)
    const chunkType = String.fromCharCode(
      data[offset + 4]!,
      data[offset + 5]!,
      data[offset + 6]!,
      data[offset + 7]!
    );

    // Total chunk size: 4 (length) + 4 (type) + chunkLen (data) + 4 (CRC)
    const totalChunkSize = 12 + chunkLen;

    if (metadataChunks.has(chunkType)) {
      // Skip this chunk
      offset += totalChunkSize;
      continue;
    }

    // Copy chunk
    for (let i = 0; i < totalChunkSize && offset + i < data.length; i++) {
      result.push(data[offset + i]!);
    }
    offset += totalChunkSize;
  }

  return new Uint8Array(result);
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  let base64Data: string;
  let mimeType: string;

  // Parse data URL or raw base64
  const dataUrlMatch = input.input.match(
    /^data:(image\/(?:jpeg|png|jpg));base64,(.+)$/
  );
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1]!;
    base64Data = dataUrlMatch[2]!;
  } else {
    // Try to detect format from base64 data
    base64Data = input.input.trim();
    // JPEG starts with /9j/ in base64 (FFD8), PNG starts with iVBOR (89504E47)
    if (base64Data.startsWith("/9j/") || base64Data.startsWith("/9j+")) {
      mimeType = "image/jpeg";
    } else if (base64Data.startsWith("iVBOR")) {
      mimeType = "image/png";
    } else {
      throw new Error(
        "Unsupported image format. Please provide a JPEG or PNG image as a base64 data URL."
      );
    }
  }

  // Decode base64 to binary
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  let stripped: Uint8Array;

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    stripped = stripJpegExif(bytes);
  } else if (mimeType === "image/png") {
    stripped = stripPngMetadata(bytes);
  } else {
    throw new Error(
      "Unsupported image format. Only JPEG and PNG are supported."
    );
  }

  // Encode back to base64 data URL
  let strippedBinary = "";
  for (let i = 0; i < stripped.length; i++) {
    strippedBinary += String.fromCharCode(stripped[i]!);
  }
  const outputBase64 = btoa(strippedBinary);

  return {
    output: `data:${mimeType};base64,${outputBase64}`,
  };
}

export const exifRemover = defineTool({
  meta: {
    id: "image/exif-remover",
    name: "EXIF Remover",
    description:
      "Free online EXIF remover — strip all metadata from JPEG images to protect privacy instantly in your browser. No data is stored. Removes camera info, GPS location, timestamps, and software tags.",
    category: "image",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["exif", "remove", "privacy", "metadata", "strip", "jpeg", "png"],
    examples: [
      {
        title: "Strip JPEG Metadata",
        description:
          "Remove GPS location and camera info from a JPEG for privacy",
        input: "data:image/jpeg;base64,/9j/4AAQ... (JPEG image data URL)",
        output: "data:image/jpeg;base64,... (JPEG with metadata stripped)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
