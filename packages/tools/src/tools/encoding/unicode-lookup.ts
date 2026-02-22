import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "Unicode codepoint (U+XXXX or 0xXXXX), character, or search query"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("Unicode character information"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getUnicodeCategory(cp: number): string {
  if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f)) return "Control";
  if (cp >= 0x30 && cp <= 0x39) return "Decimal Digit";
  if (cp >= 0x41 && cp <= 0x5a) return "Uppercase Letter";
  if (cp >= 0x61 && cp <= 0x7a) return "Lowercase Letter";
  if (cp >= 0xc0 && cp <= 0xff) return "Latin Extended";
  if (cp >= 0x100 && cp <= 0x24f) return "Latin Extended-A/B";
  if (cp >= 0x370 && cp <= 0x3ff) return "Greek and Coptic";
  if (cp >= 0x400 && cp <= 0x4ff) return "Cyrillic";
  if (cp >= 0x530 && cp <= 0x58f) return "Armenian";
  if (cp >= 0x590 && cp <= 0x5ff) return "Hebrew";
  if (cp >= 0x600 && cp <= 0x6ff) return "Arabic";
  if (cp >= 0x900 && cp <= 0x97f) return "Devanagari";
  if (cp >= 0xe00 && cp <= 0xe7f) return "Thai";
  if (cp >= 0x1100 && cp <= 0x11ff) return "Hangul Jamo";
  if (cp >= 0x2000 && cp <= 0x206f) return "General Punctuation";
  if (cp >= 0x2070 && cp <= 0x209f) return "Superscripts and Subscripts";
  if (cp >= 0x20a0 && cp <= 0x20cf) return "Currency Symbols";
  if (cp >= 0x2100 && cp <= 0x214f) return "Letterlike Symbols";
  if (cp >= 0x2190 && cp <= 0x21ff) return "Arrows";
  if (cp >= 0x2200 && cp <= 0x22ff) return "Mathematical Operators";
  if (cp >= 0x2300 && cp <= 0x23ff) return "Miscellaneous Technical";
  if (cp >= 0x2500 && cp <= 0x257f) return "Box Drawing";
  if (cp >= 0x2580 && cp <= 0x259f) return "Block Elements";
  if (cp >= 0x25a0 && cp <= 0x25ff) return "Geometric Shapes";
  if (cp >= 0x2600 && cp <= 0x26ff) return "Miscellaneous Symbols";
  if (cp >= 0x2700 && cp <= 0x27bf) return "Dingbats";
  if (cp >= 0x3000 && cp <= 0x303f) return "CJK Symbols and Punctuation";
  if (cp >= 0x3040 && cp <= 0x309f) return "Hiragana";
  if (cp >= 0x30a0 && cp <= 0x30ff) return "Katakana";
  if (cp >= 0x4e00 && cp <= 0x9fff) return "CJK Unified Ideographs";
  if (cp >= 0xac00 && cp <= 0xd7af) return "Hangul Syllables";
  if (cp >= 0xfe00 && cp <= 0xfe0f) return "Variation Selectors";
  if (cp >= 0xfff0 && cp <= 0xffff) return "Specials";
  if (cp >= 0x1f300 && cp <= 0x1f5ff)
    return "Miscellaneous Symbols and Pictographs";
  if (cp >= 0x1f600 && cp <= 0x1f64f) return "Emoticons";
  if (cp >= 0x1f680 && cp <= 0x1f6ff) return "Transport and Map Symbols";
  if (cp >= 0x1f900 && cp <= 0x1f9ff)
    return "Supplemental Symbols and Pictographs";
  if (cp >= 0x20 && cp <= 0x7e) return "Basic Latin";
  return "Other";
}

function formatCodePointInfo(cp: number): string {
  const lines: string[] = [];
  const char = String.fromCodePoint(cp);
  const displayChar = cp < 0x20 || cp === 0x7f ? "(control)" : char;

  lines.push(`Character: ${displayChar}`);
  lines.push(`Code Point: U+${cp.toString(16).toUpperCase().padStart(4, "0")}`);
  lines.push(`Decimal: ${cp}`);
  lines.push(`Hex: 0x${cp.toString(16).toUpperCase()}`);
  lines.push(`Octal: 0${cp.toString(8)}`);
  lines.push(`Binary: ${cp.toString(2)}`);
  lines.push(`Block: ${getUnicodeCategory(cp)}`);

  // UTF-8 encoding
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(char);
  lines.push(
    `UTF-8: ${Array.from(utf8)
      .map((b) => "0x" + b.toString(16).toUpperCase().padStart(2, "0"))
      .join(" ")} (${utf8.length} byte${utf8.length > 1 ? "s" : ""})`
  );

  // UTF-16 encoding
  const utf16Units: string[] = [];
  for (let i = 0; i < char.length; i++) {
    utf16Units.push(
      "0x" + char.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")
    );
  }
  lines.push(
    `UTF-16: ${utf16Units.join(" ")} (${utf16Units.length} unit${utf16Units.length > 1 ? "s" : ""})`
  );

  // HTML entities
  lines.push(`HTML Decimal: &#${cp};`);
  lines.push(`HTML Hex: &#x${cp.toString(16).toUpperCase()};`);
  lines.push(`CSS: \\${cp.toString(16).toUpperCase()}`);
  lines.push(
    `JavaScript: \\u${cp.toString(16).toUpperCase().padStart(4, "0")}`
  );

  return lines.join("\n");
}

function execute(input: Input): Output {
  try {
    const trimmed = input.input.trim();
    if (!trimmed) {
      throw new Error("Input cannot be empty");
    }

    // Check if input is a codepoint (U+XXXX or 0xXXXX)
    const uPlusMatch = trimmed.match(/^[Uu]\+([0-9a-fA-F]{1,6})$/);
    if (uPlusMatch && uPlusMatch[1]) {
      const cp = parseInt(uPlusMatch[1], 16);
      return { output: formatCodePointInfo(cp) };
    }

    const hexMatch = trimmed.match(/^0x([0-9a-fA-F]{1,6})$/);
    if (hexMatch && hexMatch[1]) {
      const cp = parseInt(hexMatch[1], 16);
      return { output: formatCodePointInfo(cp) };
    }

    // Check if it's a decimal number
    if (/^\d+$/.test(trimmed)) {
      const cp = parseInt(trimmed, 10);
      if (cp >= 0 && cp <= 0x10ffff) {
        return { output: formatCodePointInfo(cp) };
      }
    }

    // If single character or few characters, show info for each
    const codePoints: number[] = [];
    for (const ch of trimmed) {
      codePoints.push(ch.codePointAt(0)!);
    }

    if (codePoints.length <= 10) {
      const results = codePoints.map((cp) => formatCodePointInfo(cp));
      return { output: results.join("\n\n---\n\n") };
    }

    // For longer text, show summary
    const lines: string[] = [];
    lines.push(`Characters: ${codePoints.length}`);
    lines.push("");
    for (const cp of codePoints.slice(0, 20)) {
      const char = cp < 0x20 ? "(ctrl)" : String.fromCodePoint(cp);
      lines.push(
        `'${char}' U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${getUnicodeCategory(cp)}`
      );
    }
    if (codePoints.length > 20) {
      lines.push(`... and ${codePoints.length - 20} more characters`);
    }

    return { output: lines.join("\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lookup failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Unicode lookup failed: ${msg}`,
    });
  }
}

export const unicodeLookup = defineTool({
  meta: {
    id: "encoding/unicode-lookup",
    name: "Unicode Lookup",
    description:
      "Free online Unicode lookup — search Unicode characters by code point, hex value, decimal, or character instantly in your browser. No data is stored. Shows block classification, UTF-8/UTF-16 encoding details, and HTML/CSS/JavaScript escape formats.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["unicode", "lookup", "codepoint", "character", "search"],
    examples: [
      {
        title: "Lookup by Code Point",
        description: "Look up Unicode character information by code point",
        input: "U+0041",
        output:
          "Character: A\nCode Point: U+0041\nDecimal: 65\nHex: 0x41\nOctal: 0101\nBinary: 1000001\nBlock: Uppercase Letter\nUTF-8: 0x41 (1 byte)\nUTF-16: 0x0041 (1 unit)\nHTML Decimal: &#65;\nHTML Hex: &#x41;\nCSS: \\41\nJavaScript: \\u0041",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
