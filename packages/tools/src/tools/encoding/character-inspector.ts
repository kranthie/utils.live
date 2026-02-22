import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to inspect character-by-character"),
});

const outputSchema = z.object({
  output: z.string().describe("Detailed character inspection results"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getCharType(cp: number): string {
  if (cp <= 0x1f || cp === 0x7f) return "Control";
  if (cp >= 0x80 && cp <= 0x9f) return "Control (C1)";
  if (cp === 0x20) return "Space";
  if (cp >= 0x2000 && cp <= 0x200f) return "Unicode Space/Format";
  if (cp === 0xfeff) return "BOM / Zero-Width No-Break Space";
  if (cp === 0x200b) return "Zero-Width Space";
  if (cp === 0x200c) return "Zero-Width Non-Joiner";
  if (cp === 0x200d) return "Zero-Width Joiner";
  if (cp >= 0x30 && cp <= 0x39) return "Digit";
  if (cp >= 0x41 && cp <= 0x5a) return "Uppercase Letter";
  if (cp >= 0x61 && cp <= 0x7a) return "Lowercase Letter";
  if (cp >= 0x21 && cp <= 0x2f) return "Punctuation";
  if (cp >= 0x3a && cp <= 0x40) return "Punctuation";
  if (cp >= 0x5b && cp <= 0x60) return "Punctuation";
  if (cp >= 0x7b && cp <= 0x7e) return "Punctuation";
  if (cp >= 0x1f600 && cp <= 0x1f64f) return "Emoji (Emoticons)";
  if (cp >= 0x1f300 && cp <= 0x1f9ff) return "Emoji/Symbol";
  return "Character";
}

function execute(input: Input): Output {
  try {
    if (!input.input) {
      throw new Error("Input cannot be empty");
    }

    const encoder = new TextEncoder();
    const totalUtf8 = encoder.encode(input.input);

    const lines: string[] = [];
    lines.push(`=== Text Inspector ===`);
    lines.push(`String length (UTF-16 units): ${input.input.length}`);

    // Count actual code points
    let cpCount = 0;
    for (const _ of input.input) {
      cpCount++;
    }
    lines.push(`Code points: ${cpCount}`);
    lines.push(`UTF-8 byte length: ${totalUtf8.length}`);
    lines.push("");
    lines.push("Idx | Char | Code Point       | UTF-8 Bytes      | Type");
    lines.push("----|------|------------------|------------------|----");

    let idx = 0;
    for (const ch of input.input) {
      const cp = ch.codePointAt(0)!;
      const utf8Bytes = encoder.encode(ch);
      const utf8Hex = Array.from(utf8Bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");

      const display =
        cp < 0x20 ||
        cp === 0x7f ||
        (cp >= 0x80 && cp <= 0x9f) ||
        cp === 0xfeff ||
        cp === 0x200b
          ? `(U+${cp.toString(16).toUpperCase().padStart(4, "0")})`
          : ch;

      const cpStr = `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
      const type = getCharType(cp);

      lines.push(
        `${idx.toString().padStart(3)} | ${display.padEnd(4)} | ${cpStr.padEnd(16)} | ${utf8Hex.padEnd(16)} | ${type}`
      );
      idx++;
    }

    return { output: lines.join("\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Inspection failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Character inspection failed: ${msg}`,
    });
  }
}

export const characterInspector = defineTool({
  meta: {
    id: "encoding/character-inspector",
    name: "Character Inspector",
    description:
      "Free online character inspector — examine each character's Unicode code point, UTF-8 bytes, and type classification instantly in your browser. No data is stored. Detects control characters, zero-width characters, emoji, and displays detailed byte-level information.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["character", "inspect", "unicode", "bytes", "codepoint"],
    examples: [
      {
        title: "Inspect Characters",
        description:
          "Inspect each character in a short string with code points and UTF-8 bytes",
        input: "ABC",
        output:
          "=== Text Inspector ===\nString length (UTF-16 units): 3\nCode points: 3\nUTF-8 byte length: 3\n\nIdx | Char | Code Point       | UTF-8 Bytes      | Type\n----|------|------------------|------------------|----\n  0 | A    | U+0041           | 41               | Uppercase Letter\n  1 | B    | U+0042           | 42               | Uppercase Letter\n  2 | C    | U+0043           | 43               | Uppercase Letter",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
