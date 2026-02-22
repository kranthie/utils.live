import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(50)
    .describe("Text to encode (A-Z, 0-9, -.$/+% SPACE)"),
  height: z
    .number()
    .min(20)
    .max(200)
    .default(80)
    .describe("Barcode height in pixels"),
  showText: z.boolean().default(true).describe("Show text below barcode"),
});

const outputSchema = z.object({
  output: z.string().describe("Code 39 barcode as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Code 39 patterns: narrow=1, wide=3, bars and spaces alternate starting with bar
const CODE39_CHARS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnn0",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  $: "nwnwnwnnn",
  "/": "nwnwnnnwn",
  "+": "nwnnnwnwn",
  "%": "nnnwnwnwn",
  "*": "nwnnwnwnn",
};

function execute(input: Input): Output {
  const text = input.text.toUpperCase();

  // Validate characters
  for (const ch of text) {
    if (!CODE39_CHARS[ch]) {
      throw new Error(
        `Character '${ch}' is not valid in Code 39. Allowed: A-Z, 0-9, -.$/+% and SPACE`
      );
    }
  }

  // Build pattern with start/stop characters
  const fullText = "*" + text + "*";
  const narrowWidth = 1;
  const wideWidth = 3;
  const gapWidth = 1;

  // Calculate total width
  let totalBarWidth = 0;
  for (const ch of fullText) {
    const pattern = CODE39_CHARS[ch] || "";
    for (const p of pattern) {
      totalBarWidth += p === "w" ? wideWidth : narrowWidth;
    }
    totalBarWidth += gapWidth; // inter-character gap
  }

  const scale = 2;
  const quietZone = 10 * scale;
  const svgWidth = totalBarWidth * scale + quietZone * 2;
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${totalHeight}" width="${svgWidth}" height="${totalHeight}">`;
  svg += `<rect width="${svgWidth}" height="${totalHeight}" fill="white"/>`;

  let x = quietZone;
  for (const ch of fullText) {
    const pattern = CODE39_CHARS[ch] || "";
    for (let i = 0; i < pattern.length; i++) {
      const isBar = i % 2 === 0;
      const width = (pattern[i] === "w" ? wideWidth : narrowWidth) * scale;
      if (isBar) {
        svg += `<rect x="${x}" y="5" width="${width}" height="${input.height}" fill="black"/>`;
      }
      x += width;
    }
    x += gapWidth * scale;
  }

  if (input.showText) {
    svg += `<text x="${svgWidth / 2}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="12">${escapeXml(text)}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const code39Generator = defineTool({
  meta: {
    id: "diagram/code39-generator",
    name: "Code 39 Generator",
    description:
      "Free online Code 39 barcode generator — create Code 39 barcodes as SVG from uppercase alphanumeric text instantly in your browser. No data is stored. Supports custom dimensions, text visibility, and narrow/wide bar ratio.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "code39", "generate", "svg"],
    examples: [
      {
        title: "Inventory Label",
        description: "Generate a Code 39 barcode for inventory tracking",
        input: { text: "ITEM-001", height: 80, showText: true },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" width="360" height="110"><rect width="360" height="110" fill="white"/><rect x="20" y="5" width="2" height="80" fill="black"/><rect x="28" y="5" width="2" height="80" fill="black"/><rect x="32" y="5" width="6" height="80" fill="black"/><rect x="40" y="5" width="6" height="80" fill="black"/><rect x="48" y="5" width="2" height="80" fill="black"/><rect x="52" y="5" width="2" height="80" fill="black"/><rect x="56" y="5" width="6" height="80" fill="black"/><rect x="64" y="5" width="2" height="80" fill="black"/><rect x="72" y="5" width="6" height="80" fill="black"/><rect x="80" y="5" width="2" height="80" fill="black"/><rect x="84" y="5" width="2" height="80" fill="black"/><rect x="88" y="5" width="2" height="80" fill="black"/><rect x="92" y="5" width="6" height="80" fill="black"/><rect x="100" y="5" width="6" height="80" fill="black"/><rect x="112" y="5" width="2" height="80" fill="black"/><rect x="116" y="5" width="6" height="80" fill="black"/><rect x="124" y="5" width="2" height="80" fill="black"/><rect x="128" y="5" width="6" height="80" fill="black"/><rect x="140" y="5" width="2" height="80" fill="black"/><rect x="144" y="5" width="2" height="80" fill="black"/><rect x="148" y="5" width="6" height="80" fill="black"/><rect x="156" y="5" width="6" height="80" fill="black"/><rect x="164" y="5" width="2" height="80" fill="black"/><rect x="168" y="5" width="2" height="80" fill="black"/><rect x="176" y="5" width="2" height="80" fill="black"/><rect x="180" y="5" width="2" height="80" fill="black"/><rect x="188" y="5" width="2" height="80" fill="black"/><rect x="192" y="5" width="2" height="80" fill="black"/><rect x="196" y="5" width="6" height="80" fill="black"/><rect x="204" y="5" width="6" height="80" fill="black"/><rect x="212" y="5" width="2" height="80" fill="black"/><rect x="216" y="5" width="2" height="80" fill="black"/><rect x="224" y="5" width="6" height="80" fill="black"/><rect x="232" y="5" width="6" height="80" fill="black"/><rect x="240" y="5" width="2" height="80" fill="black"/><rect x="244" y="5" width="2" height="80" fill="black"/><rect x="248" y="5" width="2" height="80" fill="black"/><rect x="256" y="5" width="6" height="80" fill="black"/><rect x="264" y="5" width="6" height="80" fill="black"/><rect x="272" y="5" width="2" height="80" fill="black"/><rect x="276" y="5" width="6" height="80" fill="black"/><rect x="284" y="5" width="2" height="80" fill="black"/><rect x="292" y="5" width="2" height="80" fill="black"/><rect x="296" y="5" width="2" height="80" fill="black"/><rect x="300" y="5" width="6" height="80" fill="black"/><rect x="308" y="5" width="2" height="80" fill="black"/><rect x="316" y="5" width="2" height="80" fill="black"/><rect x="320" y="5" width="6" height="80" fill="black"/><rect x="328" y="5" width="6" height="80" fill="black"/><rect x="336" y="5" width="2" height="80" fill="black"/><text x="180" y="98" text-anchor="middle" font-family="monospace" font-size="12">ITEM-001</text></svg>',
      },
    ],
    ui: {
      outputRenderer: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
