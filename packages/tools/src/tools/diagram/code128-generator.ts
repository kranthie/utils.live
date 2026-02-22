import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(80)
    .describe("Text to encode as Code 128 barcode"),
  height: z
    .number()
    .min(20)
    .max(200)
    .default(80)
    .describe("Barcode height in pixels"),
  showText: z.boolean().default(true).describe("Show text below barcode"),
});

const outputSchema = z.object({
  output: z.string().describe("Code 128 barcode as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Code 128B encoding patterns (bars: 1=black, 0=white)
const CODE128B_PATTERNS: string[] = [
  "11011001100",
  "11001101100",
  "11001100110",
  "10010011000",
  "10010001100", // 0-4
  "10001001100",
  "10011001000",
  "10011000100",
  "10001100100",
  "11001001000", // 5-9
  "11001000100",
  "11000100100",
  "10110011100",
  "10011011100",
  "10011001110", // 10-14
  "10111001100",
  "10011101100",
  "10011100110",
  "11001110010",
  "11001011100", // 15-19
  "11001001110",
  "11011100100",
  "11001110100",
  "11101101110",
  "11101001100", // 20-24
  "11100101100",
  "11100100110",
  "11101100100",
  "11100110100",
  "11100110010", // 25-29
  "11011011000",
  "11011000110",
  "11000110110",
  "10100011000",
  "10001011000", // 30-34
  "10001000110",
  "10110001000",
  "10001101000",
  "10001100010",
  "11010001000", // 35-39
  "11000101000",
  "11000100010",
  "10110111000",
  "10110001110",
  "10001101110", // 40-44
  "10111011000",
  "10111000110",
  "10001110110",
  "11101110110",
  "11010001110", // 45-49
  "11000101110",
  "11011101000",
  "11011100010",
  "11011101110",
  "11101011000", // 50-54
  "11101000110",
  "11100010110",
  "11101101000",
  "11101100010",
  "11100011010", // 55-59
  "11101111010",
  "11001000010",
  "11110001010",
  "10100110000",
  "10100001100", // 60-64
  "10010110000",
  "10010000110",
  "10000101100",
  "10000100110",
  "10110010000", // 65-69
  "10110000100",
  "10011010000",
  "10011000010",
  "10000110100",
  "10000110010", // 70-74
  "11000010010",
  "11001010000",
  "11110111010",
  "11000010100",
  "10001111010", // 75-79
  "10100111100",
  "10010111100",
  "10010011110",
  "10111100100",
  "10011110100", // 80-84
  "10011110010",
  "11110100100",
  "11110010100",
  "11110010010",
  "11011011110", // 85-89
  "11011110110",
  "11110110110",
  "10101111000",
  "10100011110",
  "10001011110", // 90-94
  "10111101000",
  "10111100010",
  "11110101000",
  "11110100010",
  "10111011110", // 95-99
  "10111101110",
  "11101011110",
  "11110101110", // 100-102
  "11010000100", // START B (103)
  "1100011101011", // STOP (106)
];

const START_B = 104;
const STOP = 106;

function execute(input: Input): Output {
  const text = input.text;

  // Encode using Code 128B (ASCII 32-127)
  const values: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode < 32 || charCode > 127) {
      throw new Error(
        `Character '${text[i]}' (code ${charCode}) is not supported in Code 128B. Use ASCII characters 32-127.`
      );
    }
    const value = charCode - 32;
    values.push(value);
    checksum += value * (i + 1);
  }

  checksum = checksum % 103;
  values.push(checksum);

  // Build bar pattern
  let pattern = "";
  for (const value of values) {
    pattern += CODE128B_PATTERNS[value] || "";
  }
  // Add stop pattern
  pattern += CODE128B_PATTERNS[STOP - 3]; // STOP is at index 106, stored at position 104 in array

  // Generate SVG
  const barWidth = 2;
  const barcodeWidth = pattern.length * barWidth;
  const totalWidth = barcodeWidth + 20; // quiet zones
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  // Draw bars
  let x = 10; // quiet zone
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1") {
      svg += `<rect x="${x}" y="5" width="${barWidth}" height="${input.height}" fill="black"/>`;
    }
    x += barWidth;
  }

  // Draw text
  if (input.showText) {
    svg += `<text x="${totalWidth / 2}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="12">${escapeXml(text)}</text>`;
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

export const code128Generator = defineTool({
  meta: {
    id: "diagram/code128-generator",
    name: "Code 128 Generator",
    description:
      "Free online Code 128 barcode generator — create Code 128 barcodes as SVG from alphanumeric text instantly in your browser. No data is stored. Supports custom width, height, optional text display, and configurable bar width.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "code128", "generate", "svg"],
    examples: [
      {
        title: "Product Barcode",
        description: "Generate a Code 128 barcode for a product SKU",
        input: { text: "SKU-12345", height: 80, showText: true },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 288 110" width="288" height="110"><rect width="288" height="110" fill="white"/><rect x="10" y="5" width="2" height="80" fill="black"/><rect x="12" y="5" width="2" height="80" fill="black"/><rect x="20" y="5" width="2" height="80" fill="black"/><rect x="22" y="5" width="2" height="80" fill="black"/><rect x="24" y="5" width="2" height="80" fill="black"/><rect x="28" y="5" width="2" height="80" fill="black"/><rect x="32" y="5" width="2" height="80" fill="black"/><rect x="34" y="5" width="2" height="80" fill="black"/><rect x="36" y="5" width="2" height="80" fill="black"/><rect x="38" y="5" width="2" height="80" fill="black"/><rect x="42" y="5" width="2" height="80" fill="black"/><rect x="44" y="5" width="2" height="80" fill="black"/><rect x="46" y="5" width="2" height="80" fill="black"/><rect x="50" y="5" width="2" height="80" fill="black"/><rect x="58" y="5" width="2" height="80" fill="black"/><rect x="62" y="5" width="2" height="80" fill="black"/><rect x="64" y="5" width="2" height="80" fill="black"/><rect x="72" y="5" width="2" height="80" fill="black"/><rect x="74" y="5" width="2" height="80" fill="black"/><rect x="76" y="5" width="2" height="80" fill="black"/><rect x="80" y="5" width="2" height="80" fill="black"/><rect x="82" y="5" width="2" height="80" fill="black"/><rect x="86" y="5" width="2" height="80" fill="black"/><rect x="88" y="5" width="2" height="80" fill="black"/><rect x="90" y="5" width="2" height="80" fill="black"/><rect x="94" y="5" width="2" height="80" fill="black"/><rect x="96" y="5" width="2" height="80" fill="black"/><rect x="98" y="5" width="2" height="80" fill="black"/><rect x="102" y="5" width="2" height="80" fill="black"/><rect x="108" y="5" width="2" height="80" fill="black"/><rect x="110" y="5" width="2" height="80" fill="black"/><rect x="114" y="5" width="2" height="80" fill="black"/><rect x="116" y="5" width="2" height="80" fill="black"/><rect x="118" y="5" width="2" height="80" fill="black"/><rect x="124" y="5" width="2" height="80" fill="black"/><rect x="130" y="5" width="2" height="80" fill="black"/><rect x="132" y="5" width="2" height="80" fill="black"/><rect x="134" y="5" width="2" height="80" fill="black"/><rect x="140" y="5" width="2" height="80" fill="black"/><rect x="142" y="5" width="2" height="80" fill="black"/><rect x="146" y="5" width="2" height="80" fill="black"/><rect x="148" y="5" width="2" height="80" fill="black"/><rect x="154" y="5" width="2" height="80" fill="black"/><rect x="156" y="5" width="2" height="80" fill="black"/><rect x="158" y="5" width="2" height="80" fill="black"/><rect x="164" y="5" width="2" height="80" fill="black"/><rect x="168" y="5" width="2" height="80" fill="black"/><rect x="170" y="5" width="2" height="80" fill="black"/><rect x="176" y="5" width="2" height="80" fill="black"/><rect x="180" y="5" width="2" height="80" fill="black"/><rect x="182" y="5" width="2" height="80" fill="black"/><rect x="184" y="5" width="2" height="80" fill="black"/><rect x="190" y="5" width="2" height="80" fill="black"/><rect x="192" y="5" width="2" height="80" fill="black"/><rect x="198" y="5" width="2" height="80" fill="black"/><rect x="204" y="5" width="2" height="80" fill="black"/><rect x="206" y="5" width="2" height="80" fill="black"/><rect x="208" y="5" width="2" height="80" fill="black"/><rect x="212" y="5" width="2" height="80" fill="black"/><rect x="214" y="5" width="2" height="80" fill="black"/><rect x="218" y="5" width="2" height="80" fill="black"/><rect x="220" y="5" width="2" height="80" fill="black"/><rect x="222" y="5" width="2" height="80" fill="black"/><rect x="228" y="5" width="2" height="80" fill="black"/><rect x="234" y="5" width="2" height="80" fill="black"/><rect x="236" y="5" width="2" height="80" fill="black"/><rect x="238" y="5" width="2" height="80" fill="black"/><rect x="240" y="5" width="2" height="80" fill="black"/><rect x="244" y="5" width="2" height="80" fill="black"/><rect x="248" y="5" width="2" height="80" fill="black"/><rect x="256" y="5" width="2" height="80" fill="black"/><rect x="258" y="5" width="2" height="80" fill="black"/><rect x="262" y="5" width="2" height="80" fill="black"/><rect x="272" y="5" width="2" height="80" fill="black"/><text x="144" y="98" text-anchor="middle" font-family="monospace" font-size="12">SKU-12345</text></svg>',
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
