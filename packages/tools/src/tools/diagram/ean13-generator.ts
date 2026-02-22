import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  digits: z
    .string()
    .regex(/^\d{12,13}$/, "Must be 12 or 13 digits")
    .describe(
      "12-digit number (check digit auto-calculated) or 13-digit with check digit"
    ),
  height: z
    .number()
    .min(20)
    .max(200)
    .default(80)
    .describe("Barcode height in pixels"),
  showText: z.boolean().default(true).describe("Show digits below barcode"),
});

const outputSchema = z.object({
  output: z.string().describe("EAN-13 barcode as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// L, G, R encodings for digits 0-9
const L_CODES = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
];
const G_CODES = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
];
const R_CODES = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
];

// First digit encoding pattern (which of the left 6 use L vs G)
const FIRST_DIGIT_PATTERNS = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
];

function calculateCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digits.charAt(i), 10);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return (10 - (sum % 10)) % 10;
}

function execute(input: Input): Output {
  let digits = input.digits;

  if (digits.length === 12) {
    digits = digits + calculateCheckDigit(digits).toString();
  } else if (digits.length === 13) {
    const expected = calculateCheckDigit(digits.substring(0, 12));
    if (parseInt(digits.charAt(12), 10) !== expected) {
      throw new Error(
        `Invalid check digit. Expected ${expected}, got ${digits.charAt(12)}`
      );
    }
  }

  const firstDigit = parseInt(digits.charAt(0), 10);
  const pattern = FIRST_DIGIT_PATTERNS[firstDigit] ?? "LLLLLL";

  // Build bar pattern
  let bars = "101"; // Start guard

  // Left half (digits 1-6)
  for (let i = 0; i < 6; i++) {
    const d = parseInt(digits.charAt(i + 1), 10);
    bars += pattern.charAt(i) === "L" ? (L_CODES[d] ?? "") : (G_CODES[d] ?? "");
  }

  bars += "01010"; // Center guard

  // Right half (digits 7-12)
  for (let i = 7; i < 13; i++) {
    bars += R_CODES[parseInt(digits.charAt(i), 10)] ?? "";
  }

  bars += "101"; // End guard

  // Generate SVG
  const barWidth = 2;
  const barcodeWidth = bars.length * barWidth;
  const quietZone = 14;
  const totalWidth = barcodeWidth + quietZone * 2;
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  for (let i = 0; i < bars.length; i++) {
    if (bars[i] === "1") {
      // Guard bars are taller
      const isGuard = i < 3 || i >= bars.length - 3 || (i >= 45 && i <= 49);
      const barH = isGuard ? input.height + 5 : input.height;
      svg += `<rect x="${quietZone + i * barWidth}" y="5" width="${barWidth}" height="${barH}" fill="black"/>`;
    }
  }

  if (input.showText) {
    // First digit
    svg += `<text x="5" y="${input.height + 18}" font-family="monospace" font-size="11">${digits[0]}</text>`;
    // Left group
    const leftX = quietZone + 3 * barWidth + (21 * barWidth) / 2;
    svg += `<text x="${leftX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(1, 7)}</text>`;
    // Right group
    const rightX = quietZone + 50 * barWidth + (21 * barWidth) / 2;
    svg += `<text x="${rightX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(7, 13)}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

export const ean13Generator = defineTool({
  meta: {
    id: "diagram/ean13-generator",
    name: "EAN-13 Generator",
    description:
      "Free online EAN-13 barcode generator — create EAN-13 barcodes as SVG from 12-digit product codes with automatic check digit instantly in your browser. No data is stored. Supports custom dimensions and text visibility.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "ean13", "ean", "generate", "product"],
    examples: [
      {
        title: "Product Barcode",
        description: "Generate an EAN-13 barcode for a product",
        input: { digits: "590123412345", height: 80, showText: true },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 218 110" width="218" height="110"><rect width="218" height="110" fill="white"/><rect x="14" y="5" width="2" height="85" fill="black"/><rect x="18" y="5" width="2" height="85" fill="black"/><rect x="26" y="5" width="2" height="80" fill="black"/><rect x="30" y="5" width="2" height="80" fill="black"/><rect x="32" y="5" width="2" height="80" fill="black"/><rect x="36" y="5" width="2" height="80" fill="black"/><rect x="42" y="5" width="2" height="80" fill="black"/><rect x="44" y="5" width="2" height="80" fill="black"/><rect x="46" y="5" width="2" height="80" fill="black"/><rect x="50" y="5" width="2" height="80" fill="black"/><rect x="52" y="5" width="2" height="80" fill="black"/><rect x="58" y="5" width="2" height="80" fill="black"/><rect x="60" y="5" width="2" height="80" fill="black"/><rect x="66" y="5" width="2" height="80" fill="black"/><rect x="72" y="5" width="2" height="80" fill="black"/><rect x="74" y="5" width="2" height="80" fill="black"/><rect x="78" y="5" width="2" height="80" fill="black"/><rect x="80" y="5" width="2" height="80" fill="black"/><rect x="82" y="5" width="2" height="80" fill="black"/><rect x="84" y="5" width="2" height="80" fill="black"/><rect x="88" y="5" width="2" height="80" fill="black"/><rect x="94" y="5" width="2" height="80" fill="black"/><rect x="96" y="5" width="2" height="80" fill="black"/><rect x="98" y="5" width="2" height="80" fill="black"/><rect x="102" y="5" width="2" height="80" fill="black"/><rect x="106" y="5" width="2" height="85" fill="black"/><rect x="110" y="5" width="2" height="85" fill="black"/><rect x="114" y="5" width="2" height="80" fill="black"/><rect x="116" y="5" width="2" height="80" fill="black"/><rect x="122" y="5" width="2" height="80" fill="black"/><rect x="124" y="5" width="2" height="80" fill="black"/><rect x="128" y="5" width="2" height="80" fill="black"/><rect x="130" y="5" width="2" height="80" fill="black"/><rect x="134" y="5" width="2" height="80" fill="black"/><rect x="136" y="5" width="2" height="80" fill="black"/><rect x="142" y="5" width="2" height="80" fill="black"/><rect x="152" y="5" width="2" height="80" fill="black"/><rect x="156" y="5" width="2" height="80" fill="black"/><rect x="160" y="5" width="2" height="80" fill="black"/><rect x="162" y="5" width="2" height="80" fill="black"/><rect x="164" y="5" width="2" height="80" fill="black"/><rect x="170" y="5" width="2" height="80" fill="black"/><rect x="176" y="5" width="2" height="80" fill="black"/><rect x="178" y="5" width="2" height="80" fill="black"/><rect x="180" y="5" width="2" height="80" fill="black"/><rect x="184" y="5" width="2" height="80" fill="black"/><rect x="192" y="5" width="2" height="80" fill="black"/><rect x="198" y="5" width="2" height="85" fill="black"/><rect x="202" y="5" width="2" height="85" fill="black"/><text x="5" y="98" font-family="monospace" font-size="11">5</text><text x="41" y="98" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">901234</text><text x="135" y="98" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">123457</text></svg>',
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
