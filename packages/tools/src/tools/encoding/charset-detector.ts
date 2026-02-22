import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to analyze for encoding characteristics"),
});

const outputSchema = z.object({
  output: z.string().describe("Encoding detection results"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    if (!input.input) {
      throw new Error("Input cannot be empty");
    }

    const text = input.input;
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(text);

    const lines: string[] = [];
    lines.push("=== Encoding Analysis ===");

    // Check for BOM
    let hasBom = false;
    if (text.charCodeAt(0) === 0xfeff) {
      lines.push("BOM detected: UTF-8/UTF-16 BOM (U+FEFF)");
      hasBom = true;
    } else if (text.charCodeAt(0) === 0xfffe) {
      lines.push("BOM detected: UTF-16 LE BOM");
      hasBom = true;
    }
    if (!hasBom) {
      lines.push("BOM: None detected");
    }

    // Analyze character ranges
    let asciiCount = 0;
    let latin1Count = 0;
    let bmpCount = 0;
    let supplementaryCount = 0;
    let controlCount = 0;
    let whitespaceCount = 0;
    let zeroWidthCount = 0;

    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (cp <= 0x7f) {
        asciiCount++;
        if (cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d) {
          controlCount++;
        }
        if (cp === 0x20 || cp === 0x09 || cp === 0x0a || cp === 0x0d) {
          whitespaceCount++;
        }
      } else if (cp <= 0xff) {
        latin1Count++;
      } else if (cp <= 0xffff) {
        bmpCount++;
        if (cp >= 0x200b && cp <= 0x200f) zeroWidthCount++;
        if (cp === 0xfeff) zeroWidthCount++;
      } else {
        supplementaryCount++;
      }
    }

    let cpCount = 0;
    for (const _ of text) cpCount++;

    const totalChars = cpCount;

    lines.push("");
    lines.push("=== Character Distribution ===");
    lines.push(`Total code points: ${totalChars}`);
    lines.push(
      `ASCII (U+0000-U+007F): ${asciiCount} (${((asciiCount / totalChars) * 100).toFixed(1)}%)`
    );
    lines.push(
      `Latin-1 (U+0080-U+00FF): ${latin1Count} (${((latin1Count / totalChars) * 100).toFixed(1)}%)`
    );
    lines.push(
      `BMP (U+0100-U+FFFF): ${bmpCount} (${((bmpCount / totalChars) * 100).toFixed(1)}%)`
    );
    lines.push(
      `Supplementary (U+10000+): ${supplementaryCount} (${((supplementaryCount / totalChars) * 100).toFixed(1)}%)`
    );

    if (controlCount > 0) {
      lines.push(`Control characters: ${controlCount}`);
    }
    if (zeroWidthCount > 0) {
      lines.push(`Zero-width/invisible characters: ${zeroWidthCount}`);
    }
    lines.push(`Whitespace characters: ${whitespaceCount}`);

    lines.push("");
    lines.push("=== Encoding Compatibility ===");

    if (asciiCount === totalChars) {
      lines.push("Compatible with: ASCII, UTF-8, Latin-1, UTF-16, UTF-32");
      lines.push("Recommended encoding: ASCII or UTF-8");
    } else if (asciiCount + latin1Count === totalChars) {
      lines.push(
        "Compatible with: Latin-1 (ISO-8859-1), UTF-8, UTF-16, UTF-32"
      );
      lines.push("NOT pure ASCII");
      lines.push("Recommended encoding: UTF-8");
    } else if (supplementaryCount === 0) {
      lines.push("Compatible with: UTF-8, UTF-16, UTF-32");
      lines.push("NOT ASCII or Latin-1 compatible");
      lines.push("Recommended encoding: UTF-8");
    } else {
      lines.push("Compatible with: UTF-8, UTF-16, UTF-32");
      lines.push(
        "Contains supplementary plane characters (requires surrogate pairs in UTF-16)"
      );
      lines.push("Recommended encoding: UTF-8");
    }

    lines.push("");
    lines.push("=== Size Estimates ===");
    lines.push(`UTF-8: ${utf8Bytes.length} bytes`);
    lines.push(`UTF-16: ${text.length * 2} bytes`);
    lines.push(`UTF-32: ${totalChars * 4} bytes`);

    return { output: lines.join("\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Detection failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Charset detection failed: ${msg}`,
    });
  }
}

export const charsetDetector = defineTool({
  meta: {
    id: "encoding/charset-detector",
    name: "Charset Detector",
    description:
      "Free online charset detector — analyze text encoding characteristics and compatibility instantly in your browser. No data is stored. Reports ASCII, Latin-1, BMP, and supplementary character distribution with UTF-8/UTF-16/UTF-32 size estimates.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["charset", "detect", "encoding", "utf8", "ascii", "latin1"],
    examples: [
      {
        title: "Detect ASCII",
        description: "Analyze a pure ASCII string for encoding compatibility",
        input: "Hello, World!",
        output:
          "=== Encoding Analysis ===\nBOM: None detected\n\n=== Character Distribution ===\nTotal code points: 13\nASCII (U+0000-U+007F): 13 (100.0%)\nLatin-1 (U+0080-U+00FF): 0 (0.0%)\nBMP (U+0100-U+FFFF): 0 (0.0%)\nSupplementary (U+10000+): 0 (0.0%)\nWhitespace characters: 1\n\n=== Encoding Compatibility ===\nCompatible with: ASCII, UTF-8, Latin-1, UTF-16, UTF-32\nRecommended encoding: ASCII or UTF-8\n\n=== Size Estimates ===\nUTF-8: 13 bytes\nUTF-16: 26 bytes\nUTF-32: 52 bytes",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
