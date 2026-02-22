import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to show UTF-8 bytes and UTF-16 code units"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("UTF-8 byte representation and UTF-16 code units"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    if (!input.input) {
      return { output: "(empty string)" };
    }

    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(input.input);

    const lines: string[] = [];
    lines.push("=== UTF-8 Bytes ===");
    lines.push(`Byte count: ${utf8Bytes.length}`);
    lines.push(
      `Bytes (hex): ${Array.from(utf8Bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ")}`
    );

    lines.push("");
    lines.push("=== UTF-16 Code Units ===");
    lines.push(`Code unit count: ${input.input.length}`);
    const units: string[] = [];
    for (let i = 0; i < input.input.length; i++) {
      units.push(
        input.input.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase()
      );
    }
    lines.push(`Code units (hex): ${units.join(" ")}`);

    lines.push("");
    lines.push("=== Character Details ===");
    let charIndex = 0;
    for (let i = 0; i < input.input.length; i++) {
      const codePoint = input.input.codePointAt(i)!;
      const char = String.fromCodePoint(codePoint);
      const charUtf8 = encoder.encode(char);
      const utf8Hex = Array.from(charUtf8)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");

      const utf16Units: string[] = [];
      for (let j = 0; j < char.length; j++) {
        utf16Units.push(
          char.charCodeAt(j).toString(16).padStart(4, "0").toUpperCase()
        );
      }

      const displayChar =
        codePoint < 0x20
          ? `(U+${codePoint.toString(16).padStart(4, "0").toUpperCase()})`
          : char;
      lines.push(
        `[${charIndex}] '${displayChar}' U+${codePoint.toString(16).padStart(4, "0").toUpperCase()} | UTF-8: ${utf8Hex} (${charUtf8.length}B) | UTF-16: ${utf16Units.join(" ")} (${utf16Units.length} unit${utf16Units.length > 1 ? "s" : ""})`
      );

      if (codePoint > 0xffff) i++; // Skip surrogate
      charIndex++;
    }

    return { output: lines.join("\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to convert";
    throw createToolError({
      code: EXEC_FAILED,
      message: `UTF-8 to UTF-16 conversion failed: ${msg}`,
    });
  }
}

export const utf8ToUtf16 = defineTool({
  meta: {
    id: "encoding/utf8-to-utf16",
    name: "UTF-8 to UTF-16",
    description:
      "Free online UTF-8 to UTF-16 converter — compare UTF-8 bytes and UTF-16 code units for any text instantly in your browser. No data is stored. Shows per-character byte breakdown, surrogate pairs for supplementary plane characters, and encoding size comparison.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["utf8", "utf16", "encoding", "bytes", "code-units"],
    examples: [
      {
        title: "UTF-8 Byte Breakdown",
        description:
          "Show UTF-8 bytes and UTF-16 code units for each character",
        input: "Hello",
        output:
          "=== UTF-8 Bytes ===\nByte count: 5\nBytes (hex): 48 65 6C 6C 6F\n\n=== UTF-16 Code Units ===\nCode unit count: 5\nCode units (hex): 0048 0065 006C 006C 006F\n\n=== Character Details ===\n[0] 'H' U+0048 | UTF-8: 48 (1B) | UTF-16: 0048 (1 unit)\n[1] 'e' U+0065 | UTF-8: 65 (1B) | UTF-16: 0065 (1 unit)\n[2] 'l' U+006C | UTF-8: 6C (1B) | UTF-16: 006C (1 unit)\n[3] 'l' U+006C | UTF-8: 6C (1B) | UTF-16: 006C (1 unit)\n[4] 'o' U+006F | UTF-8: 6F (1B) | UTF-16: 006F (1 unit)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
