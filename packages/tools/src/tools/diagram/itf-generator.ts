import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  digits: z
    .string()
    .regex(/^\d+$/, "Must contain only digits")
    .describe("Even number of digits to encode"),
  height: z
    .number()
    .min(20)
    .max(200)
    .default(80)
    .describe("Barcode height in pixels"),
  showText: z.boolean().default(true).describe("Show digits below barcode"),
  addCheckDigit: z
    .boolean()
    .default(false)
    .describe("Auto-add check digit if odd number of digits"),
});

const outputSchema = z.object({
  output: z.string().describe("ITF (Interleaved 2 of 5) barcode as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// ITF digit patterns: N=narrow, W=wide
const ITF_PATTERNS: Record<number, string> = {
  0: "NNWWN",
  1: "WNNNW",
  2: "NWNNW",
  3: "WWNNN",
  4: "NNWNW",
  5: "WNWNN",
  6: "NWWNN",
  7: "NNNWW",
  8: "WNNWN",
  9: "NWNWN",
};

function execute(input: Input): Output {
  let digits = input.digits;

  // ITF requires even number of digits
  if (digits.length % 2 !== 0) {
    if (input.addCheckDigit) {
      // Calculate Luhn check digit
      let sum = 0;
      for (let i = 0; i < digits.length; i++) {
        const d = parseInt(digits.charAt(i), 10);
        sum += i % 2 === 0 ? d * 3 : d;
      }
      digits = digits + ((10 - (sum % 10)) % 10).toString();
    } else {
      throw new Error(
        "ITF barcodes require an even number of digits. Enable addCheckDigit or provide an even count."
      );
    }
  }

  const narrowWidth = 2;
  const wideWidth = 5;

  // Start pattern: nnnn (4 narrow bars)
  const pattern: Array<{ width: number; isBar: boolean }> = [
    { width: narrowWidth, isBar: true },
    { width: narrowWidth, isBar: false },
    { width: narrowWidth, isBar: true },
    { width: narrowWidth, isBar: false },
  ];

  // Encode digit pairs
  for (let i = 0; i < digits.length; i += 2) {
    const d1 = parseInt(digits.charAt(i), 10);
    const d2 = parseInt(digits.charAt(i + 1), 10);
    const p1 = ITF_PATTERNS[d1] ?? "NNWWN";
    const p2 = ITF_PATTERNS[d2] ?? "NNWWN";

    for (let j = 0; j < 5; j++) {
      pattern.push({
        width: p1.charAt(j) === "W" ? wideWidth : narrowWidth,
        isBar: true,
      });
      pattern.push({
        width: p2.charAt(j) === "W" ? wideWidth : narrowWidth,
        isBar: false,
      });
    }
  }

  // Stop pattern: Wnn (wide bar, narrow space, narrow bar)
  pattern.push({ width: wideWidth, isBar: true });
  pattern.push({ width: narrowWidth, isBar: false });
  pattern.push({ width: narrowWidth, isBar: true });

  // Calculate total width
  const barcodeWidth = pattern.reduce((sum, p) => sum + p.width, 0);
  const quietZone = 20;
  const totalWidth = barcodeWidth + quietZone * 2;
  const totalHeight = input.height + (input.showText ? 20 : 0) + 10;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" fill="white"/>`;

  let x = quietZone;
  for (const p of pattern) {
    if (p.isBar) {
      svg += `<rect x="${x}" y="5" width="${p.width}" height="${input.height}" fill="black"/>`;
    }
    x += p.width;
  }

  if (input.showText) {
    svg += `<text x="${totalWidth / 2}" y="${input.height + 18}" text-anchor="middle" font-family="monospace" font-size="12">${escapeXml(digits)}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const itfGenerator = defineTool({
  meta: {
    id: "diagram/itf-generator",
    name: "ITF Generator",
    description:
      "Free online ITF barcode generator — create Interleaved 2 of 5 barcodes as SVG from numeric data instantly in your browser. No data is stored. Supports optional check digit and custom dimensions.",
    category: "diagram",
    subgroup: "Barcodes",
    tier: ToolTier.CLIENT,
    keywords: ["barcode", "itf", "interleaved", "generate"],
    examples: [
      {
        title: "Shipping Container",
        description: "Generate an ITF barcode for a shipping container",
        input: {
          digits: "12345678",
          height: 80,
          showText: true,
          addCheckDigit: false,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 185 110" width="185" height="110"><rect width="185" height="110" fill="white"/><rect x="20" y="5" width="2" height="80" fill="black"/><rect x="24" y="5" width="2" height="80" fill="black"/><rect x="28" y="5" width="5" height="80" fill="black"/><rect x="35" y="5" width="2" height="80" fill="black"/><rect x="42" y="5" width="2" height="80" fill="black"/><rect x="46" y="5" width="2" height="80" fill="black"/><rect x="50" y="5" width="5" height="80" fill="black"/><rect x="60" y="5" width="5" height="80" fill="black"/><rect x="67" y="5" width="5" height="80" fill="black"/><rect x="74" y="5" width="2" height="80" fill="black"/><rect x="81" y="5" width="2" height="80" fill="black"/><rect x="85" y="5" width="2" height="80" fill="black"/><rect x="92" y="5" width="5" height="80" fill="black"/><rect x="99" y="5" width="2" height="80" fill="black"/><rect x="106" y="5" width="5" height="80" fill="black"/><rect x="116" y="5" width="2" height="80" fill="black"/><rect x="120" y="5" width="2" height="80" fill="black"/><rect x="124" y="5" width="2" height="80" fill="black"/><rect x="131" y="5" width="2" height="80" fill="black"/><rect x="135" y="5" width="2" height="80" fill="black"/><rect x="139" y="5" width="5" height="80" fill="black"/><rect x="149" y="5" width="5" height="80" fill="black"/><rect x="156" y="5" width="5" height="80" fill="black"/><rect x="163" y="5" width="2" height="80" fill="black"/><text x="92.5" y="98" text-anchor="middle" font-family="monospace" font-size="12">12345678</text></svg>',
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
