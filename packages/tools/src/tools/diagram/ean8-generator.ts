import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  digits: z
    .string()
    .regex(/^\d{7,8}$/, "Must be 7 or 8 digits")
    .describe(
      "7-digit number (check digit auto-calculated) or 8-digit with check digit"
    ),
  height: z
    .number()
    .min(20)
    .max(200)
    .default(70)
    .describe("Barcode height in pixels"),
  showText: z.boolean().default(true).describe("Show digits below barcode"),
});

const outputSchema = z.object({
  output: z.string().describe("EAN-8 barcode as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

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

function calculateCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = parseInt(digits.charAt(i), 10);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

function execute(input: Input): Output {
  let digits = input.digits;

  if (digits.length === 7) {
    digits = digits + calculateCheckDigit(digits).toString();
  } else if (digits.length === 8) {
    const expected = calculateCheckDigit(digits.substring(0, 7));
    if (parseInt(digits.charAt(7), 10) !== expected) {
      throw new Error(
        `Invalid check digit. Expected ${expected}, got ${digits.charAt(7)}`
      );
    }
  }

  let bars = "101";
  for (let i = 0; i < 4; i++) {
    bars += L_CODES[parseInt(digits.charAt(i), 10)] ?? "";
  }
  bars += "01010";
  for (let i = 4; i < 8; i++) {
    bars += R_CODES[parseInt(digits.charAt(i), 10)] ?? "";
  }
  bars += "101";

  const barWidth = 2;
  const barcodeWidth = bars.length * barWidth;
  const quietZone = 14;
  const totalWidth = barcodeWidth + quietZone * 2;
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  for (let i = 0; i < bars.length; i++) {
    if (bars.charAt(i) === "1") {
      const isGuard = i < 3 || i >= bars.length - 3 || (i >= 31 && i <= 35);
      const barH = isGuard ? input.height + 5 : input.height;
      svg += `<rect x="${quietZone + i * barWidth}" y="5" width="${barWidth}" height="${barH}" fill="black"/>`;
    }
  }

  if (input.showText) {
    const leftX = quietZone + 3 * barWidth + (14 * barWidth) / 2;
    svg += `<text x="${leftX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(0, 4)}</text>`;
    const rightX = quietZone + 36 * barWidth + (14 * barWidth) / 2;
    svg += `<text x="${rightX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(4, 8)}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

export const ean8Generator = defineTool({
  meta: {
    id: "diagram/ean8-generator",
    name: "EAN-8 Generator",
    description:
      "Free online EAN-8 barcode generator — create EAN-8 barcodes as SVG from 7-digit codes with automatic check digit instantly in your browser. No data is stored. Supports custom dimensions and text visibility.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "ean8", "ean", "generate", "product"],
    examples: [
      {
        title: "Small Product Barcode",
        description: "Generate an EAN-8 barcode for a small product",
        input: { digits: "9638507", height: 70, showText: true },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162 100" width="162" height="100"><rect width="162" height="100" fill="white"/><rect x="14" y="5" width="2" height="75" fill="black"/><rect x="18" y="5" width="2" height="75" fill="black"/><rect x="26" y="5" width="2" height="70" fill="black"/><rect x="30" y="5" width="2" height="70" fill="black"/><rect x="32" y="5" width="2" height="70" fill="black"/><rect x="36" y="5" width="2" height="70" fill="black"/><rect x="40" y="5" width="2" height="70" fill="black"/><rect x="42" y="5" width="2" height="70" fill="black"/><rect x="44" y="5" width="2" height="70" fill="black"/><rect x="46" y="5" width="2" height="70" fill="black"/><rect x="50" y="5" width="2" height="70" fill="black"/><rect x="52" y="5" width="2" height="70" fill="black"/><rect x="54" y="5" width="2" height="70" fill="black"/><rect x="56" y="5" width="2" height="70" fill="black"/><rect x="60" y="5" width="2" height="70" fill="black"/><rect x="64" y="5" width="2" height="70" fill="black"/><rect x="66" y="5" width="2" height="70" fill="black"/><rect x="70" y="5" width="2" height="70" fill="black"/><rect x="72" y="5" width="2" height="70" fill="black"/><rect x="74" y="5" width="2" height="70" fill="black"/><rect x="78" y="5" width="2" height="75" fill="black"/><rect x="82" y="5" width="2" height="75" fill="black"/><rect x="86" y="5" width="2" height="70" fill="black"/><rect x="92" y="5" width="2" height="70" fill="black"/><rect x="94" y="5" width="2" height="70" fill="black"/><rect x="96" y="5" width="2" height="70" fill="black"/><rect x="100" y="5" width="2" height="70" fill="black"/><rect x="102" y="5" width="2" height="70" fill="black"/><rect x="104" y="5" width="2" height="70" fill="black"/><rect x="110" y="5" width="2" height="70" fill="black"/><rect x="114" y="5" width="2" height="70" fill="black"/><rect x="122" y="5" width="2" height="70" fill="black"/><rect x="128" y="5" width="2" height="70" fill="black"/><rect x="132" y="5" width="2" height="70" fill="black"/><rect x="134" y="5" width="2" height="70" fill="black"/><rect x="136" y="5" width="2" height="70" fill="black"/><rect x="142" y="5" width="2" height="75" fill="black"/><rect x="146" y="5" width="2" height="75" fill="black"/><text x="34" y="88" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">9638</text><text x="100" y="88" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">5074</text></svg>',
      },
    ],
    ui: { outputRenderer: "html" },
  },
  inputSchema,
  outputSchema,
  execute,
});
