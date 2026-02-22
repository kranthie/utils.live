import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  digits: z
    .string()
    .regex(/^\d{11,12}$/, "Must be 11 or 12 digits")
    .describe(
      "11-digit number (check digit auto-calculated) or 12-digit with check digit"
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
  output: z.string().describe("UPC-A barcode as SVG string"),
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
  for (let i = 0; i < 11; i++) {
    const d = parseInt(digits.charAt(i), 10);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

function execute(input: Input): Output {
  let digits = input.digits;

  if (digits.length === 11) {
    digits = digits + calculateCheckDigit(digits).toString();
  } else if (digits.length === 12) {
    const expected = calculateCheckDigit(digits.substring(0, 11));
    if (parseInt(digits.charAt(11), 10) !== expected) {
      throw new Error(
        `Invalid check digit. Expected ${expected}, got ${digits.charAt(11)}`
      );
    }
  }

  let bars = "101";
  for (let i = 0; i < 6; i++) {
    bars += L_CODES[parseInt(digits.charAt(i), 10)] ?? "";
  }
  bars += "01010";
  for (let i = 6; i < 12; i++) {
    bars += R_CODES[parseInt(digits.charAt(i), 10)] ?? "";
  }

  bars += "101"; // End guard

  // Generate SVG
  const barWidth = 2;
  const barcodeWidth = bars.length * barWidth;
  const quietZone = 18;
  const totalWidth = barcodeWidth + quietZone * 2;
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  for (let i = 0; i < bars.length; i++) {
    if (bars[i] === "1") {
      const isGuard = i < 3 || i >= bars.length - 3 || (i >= 45 && i <= 49);
      const barH = isGuard ? input.height + 5 : input.height;
      svg += `<rect x="${quietZone + i * barWidth}" y="5" width="${barWidth}" height="${barH}" fill="black"/>`;
    }
  }

  if (input.showText) {
    svg += `<text x="8" y="${input.height + 16}" font-family="monospace" font-size="10">${digits[0]}</text>`;
    const leftX = quietZone + 16 * barWidth;
    svg += `<text x="${leftX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(1, 6)}</text>`;
    const rightX = quietZone + 59 * barWidth;
    svg += `<text x="${rightX}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">${digits.substring(6, 11)}</text>`;
    svg += `<text x="${totalWidth - 8}" y="${input.height + 16}" text-anchor="end" font-family="monospace" font-size="10">${digits[11]}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

export const upcAGenerator = defineTool({
  meta: {
    id: "diagram/upc-a-generator",
    name: "UPC-A Generator",
    description:
      "Free online UPC-A barcode generator — create UPC-A barcodes as SVG from 11-digit product codes with automatic check digit instantly in your browser. No data is stored. Supports custom dimensions and text visibility.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "upc", "upca", "generate", "product"],
    examples: [
      {
        title: "Product UPC-A",
        description: "Generate a UPC-A barcode for a retail product",
        input: { digits: "01234567890", height: 80, showText: true },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 226 110" width="226" height="110"><rect width="226" height="110" fill="white"/><rect x="18" y="5" width="2" height="85" fill="black"/><rect x="22" y="5" width="2" height="85" fill="black"/><rect x="30" y="5" width="2" height="80" fill="black"/><rect x="32" y="5" width="2" height="80" fill="black"/><rect x="36" y="5" width="2" height="80" fill="black"/><rect x="42" y="5" width="2" height="80" fill="black"/><rect x="44" y="5" width="2" height="80" fill="black"/><rect x="50" y="5" width="2" height="80" fill="black"/><rect x="56" y="5" width="2" height="80" fill="black"/><rect x="62" y="5" width="2" height="80" fill="black"/><rect x="64" y="5" width="2" height="80" fill="black"/><rect x="68" y="5" width="2" height="80" fill="black"/><rect x="70" y="5" width="2" height="80" fill="black"/><rect x="72" y="5" width="2" height="80" fill="black"/><rect x="74" y="5" width="2" height="80" fill="black"/><rect x="78" y="5" width="2" height="80" fill="black"/><rect x="82" y="5" width="2" height="80" fill="black"/><rect x="90" y="5" width="2" height="80" fill="black"/><rect x="92" y="5" width="2" height="80" fill="black"/><rect x="96" y="5" width="2" height="80" fill="black"/><rect x="98" y="5" width="2" height="80" fill="black"/><rect x="106" y="5" width="2" height="80" fill="black"/><rect x="110" y="5" width="2" height="85" fill="black"/><rect x="114" y="5" width="2" height="85" fill="black"/><rect x="118" y="5" width="2" height="80" fill="black"/><rect x="122" y="5" width="2" height="80" fill="black"/><rect x="132" y="5" width="2" height="80" fill="black"/><rect x="140" y="5" width="2" height="80" fill="black"/><rect x="146" y="5" width="2" height="80" fill="black"/><rect x="152" y="5" width="2" height="80" fill="black"/><rect x="160" y="5" width="2" height="80" fill="black"/><rect x="162" y="5" width="2" height="80" fill="black"/><rect x="164" y="5" width="2" height="80" fill="black"/><rect x="168" y="5" width="2" height="80" fill="black"/><rect x="174" y="5" width="2" height="80" fill="black"/><rect x="176" y="5" width="2" height="80" fill="black"/><rect x="178" y="5" width="2" height="80" fill="black"/><rect x="184" y="5" width="2" height="80" fill="black"/><rect x="188" y="5" width="2" height="80" fill="black"/><rect x="194" y="5" width="2" height="80" fill="black"/><rect x="196" y="5" width="2" height="80" fill="black"/><rect x="198" y="5" width="2" height="80" fill="black"/><rect x="202" y="5" width="2" height="85" fill="black"/><rect x="206" y="5" width="2" height="85" fill="black"/><text x="8" y="96" font-family="monospace" font-size="10">0</text><text x="50" y="98" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">12345</text><text x="136" y="98" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2">67890</text><text x="218" y="96" text-anchor="end" font-family="monospace" font-size="10">5</text></svg>',
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
