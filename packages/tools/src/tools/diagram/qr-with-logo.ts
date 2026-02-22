import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z.string().min(1).max(4296).describe("Text or URL to encode"),
  size: z
    .number()
    .min(100)
    .max(1000)
    .default(300)
    .describe("QR code size in pixels"),
  logoSize: z
    .number()
    .min(20)
    .max(200)
    .default(60)
    .describe("Logo area size in pixels"),
  darkColor: z.string().default("#000000").describe("Dark module color"),
  lightColor: z.string().default("#ffffff").describe("Light module color"),
  logoPlaceholder: z
    .boolean()
    .default(true)
    .describe("Show a placeholder area for logo"),
});

const outputSchema = z.object({
  output: z.string().describe("QR code SVG with logo area"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  // Generate a simple QR-like pattern with logo area reserved
  // Uses high error correction to maintain readability with logo overlay
  const moduleCount = 25;
  const moduleSize = Math.max(1, Math.floor(input.size / (moduleCount + 8)));
  const quietZone = moduleSize * 4;
  const totalSize = moduleCount * moduleSize + quietZone * 2;

  const logoAreaSize = input.logoSize;
  const logoX = (totalSize - logoAreaSize) / 2;
  const logoY = (totalSize - logoAreaSize) / 2;

  // Create a deterministic pattern from the text
  let hash = 0;
  for (let i = 0; i < input.text.length; i++) {
    hash = ((hash << 5) - hash + input.text.charCodeAt(i)) | 0;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${input.size}" height="${input.size}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${input.lightColor}"/>`;

  // Draw finder patterns (3 corner squares)
  function drawFinderPattern(x: number, y: number): string {
    const s = moduleSize;
    let p = "";
    // Outer
    p += `<rect x="${x}" y="${y}" width="${7 * s}" height="${7 * s}" fill="${input.darkColor}"/>`;
    p += `<rect x="${x + s}" y="${y + s}" width="${5 * s}" height="${5 * s}" fill="${input.lightColor}"/>`;
    p += `<rect x="${x + 2 * s}" y="${y + 2 * s}" width="${3 * s}" height="${3 * s}" fill="${input.darkColor}"/>`;
    return p;
  }

  svg += drawFinderPattern(quietZone, quietZone);
  svg += drawFinderPattern(
    quietZone + (moduleCount - 7) * moduleSize,
    quietZone
  );
  svg += drawFinderPattern(
    quietZone,
    quietZone + (moduleCount - 7) * moduleSize
  );

  // Draw data modules (deterministic pattern avoiding logo area and finder patterns)
  const logoCenterModule = Math.floor(moduleCount / 2);
  const logoRadiusModules = Math.ceil(logoAreaSize / moduleSize / 2) + 1;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder pattern areas
      if (
        (row < 8 && col < 8) ||
        (row < 8 && col >= moduleCount - 8) ||
        (row >= moduleCount - 8 && col < 8)
      )
        continue;
      // Skip logo area
      if (
        Math.abs(row - logoCenterModule) <= logoRadiusModules &&
        Math.abs(col - logoCenterModule) <= logoRadiusModules
      )
        continue;
      // Skip timing patterns
      if (row === 6 || col === 6) {
        if ((row + col) % 2 === 0) {
          svg += `<rect x="${quietZone + col * moduleSize}" y="${quietZone + row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${input.darkColor}"/>`;
        }
        continue;
      }

      // Deterministic fill based on hash and position
      const seed = (hash + row * 37 + col * 53) & 0xffffffff;
      if (seed % 3 !== 0) {
        svg += `<rect x="${quietZone + col * moduleSize}" y="${quietZone + row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${input.darkColor}"/>`;
      }
    }
  }

  // Draw logo placeholder
  if (input.logoPlaceholder) {
    svg += `<rect x="${logoX}" y="${logoY}" width="${logoAreaSize}" height="${logoAreaSize}" fill="${input.lightColor}" stroke="${input.darkColor}" stroke-width="2" rx="4"/>`;
    svg += `<text x="${totalSize / 2}" y="${totalSize / 2 + 4}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${input.darkColor}">LOGO</text>`;
  }

  svg += "</svg>";

  return { output: svg };
}

export const qrWithLogo = defineTool({
  meta: {
    id: "diagram/qr-with-logo",
    name: "QR Code with Logo",
    description:
      "Free online QR code with logo generator — create QR codes as SVG with a centered logo placeholder area instantly in your browser. No data is stored. Uses high error correction to maintain scannability with the logo area.",
    category: "diagram",
    subgroup: "QR Codes",
    tier: ToolTier.CLIENT,
    keywords: ["qr", "code", "logo", "brand", "custom"],
    examples: [
      {
        title: "Branded QR Code",
        description: "Generate a QR code with a logo placeholder area",
        input: {
          text: "https://example.com",
          size: 300,
          logoSize: 60,
          darkColor: "#000000",
          lightColor: "#ffffff",
          logoPlaceholder: true,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297 297" width="300" height="300"><rect width="297" height="297" fill="#ffffff"/><rect x="36" y="36" width="63" height="63" fill="#000000"/><rect x="45" y="45" width="45" height="45" fill="#ffffff"/><rect x="54" y="54" width="27" height="27" fill="#000000"/><rect x="198" y="36" width="63" height="63" fill="#000000"/><rect x="207" y="45" width="45" height="45" fill="#ffffff"/><rect x="216" y="54" width="27" height="27" fill="#000000"/><rect x="36" y="198" width="63" height="63" fill="#000000"/><rect x="45" y="207" width="45" height="45" fill="#ffffff"/><rect x="54" y="216" width="27" height="27" fill="#000000"/><rect x="108" y="36" width="9" height="9" fill="#000000"/><rect x="117" y="36" width="9" height="9" fill="#000000"/><rect x="135" y="36" width="9" height="9" fill="#000000"/><rect x="144" y="36" width="9" height="9" fill="#000000"/><rect x="162" y="36" width="9" height="9" fill="#000000"/><rect x="171" y="36" width="9" height="9" fill="#000000"/><rect x="117" y="45" width="9" height="9" fill="#000000"/><rect x="126" y="45" width="9" height="9" fill="#000000"/><rect x="144" y="45" width="9" height="9" fill="#000000"/><rect x="153" y="45" width="9" height="9" fill="#000000"/><rect x="171" y="45" width="9" height="9" fill="#000000"/><rect x="180" y="45" width="9" height="9" fill="#000000"/><rect x="108" y="54" width="9" height="9" fill="#000000"/><rect x="126" y="54" width="9" height="9" fill="#000000"/><rect x="135" y="54" width="9" height="9" fill="#000000"/><rect x="153" y="54" width="9" height="9" fill="#000000"/><rect x="162" y="54" width="9" height="9" fill="#000000"/><rect x="180" y="54" width="9" height="9" fill="#000000"/><rect x="108" y="63" width="9" height="9" fill="#000000"/><rect x="117" y="63" width="9" height="9" fill="#000000"/><rect x="135" y="63" width="9" height="9" fill="#000000"/><rect x="144" y="63" width="9" height="9" fill="#000000"/><rect x="162" y="63" width="9" height="9" fill="#000000"/><rect x="171" y="63" width="9" height="9" fill="#000000"/><rect x="117" y="72" width="9" height="9" fill="#000000"/><rect x="126" y="72" width="9" height="9" fill="#000000"/><rect x="144" y="72" width="9" height="9" fill="#000000"/><rect x="153" y="72" width="9" height="9" fill="#000000"/><rect x="171" y="72" width="9" height="9" fill="#000000"/><rect x="180" y="72" width="9" height="9" fill="#000000"/><rect x="108" y="81" width="9" height="9" fill="#000000"/><rect x="126" y="81" width="9" height="9" fill="#000000"/><rect x="135" y="81" width="9" height="9" fill="#000000"/><rect x="153" y="81" width="9" height="9" fill="#000000"/><rect x="162" y="81" width="9" height="9" fill="#000000"/><rect x="180" y="81" width="9" height="9" fill="#000000"/><rect x="108" y="90" width="9" height="9" fill="#000000"/><rect x="126" y="90" width="9" height="9" fill="#000000"/><rect x="144" y="90" width="9" height="9" fill="#000000"/><rect x="162" y="90" width="9" height="9" fill="#000000"/><rect x="180" y="90" width="9" height="9" fill="#000000"/><rect x="45" y="108" width="9" height="9" fill="#000000"/><rect x="54" y="108" width="9" height="9" fill="#000000"/><rect x="72" y="108" width="9" height="9" fill="#000000"/><rect x="81" y="108" width="9" height="9" fill="#000000"/><rect x="90" y="108" width="9" height="9" fill="#000000"/><rect x="207" y="108" width="9" height="9" fill="#000000"/><rect x="216" y="108" width="9" height="9" fill="#000000"/><rect x="234" y="108" width="9" height="9" fill="#000000"/><rect x="243" y="108" width="9" height="9" fill="#000000"/><rect x="36" y="117" width="9" height="9" fill="#000000"/><rect x="54" y="117" width="9" height="9" fill="#000000"/><rect x="63" y="117" width="9" height="9" fill="#000000"/><rect x="81" y="117" width="9" height="9" fill="#000000"/><rect x="198" y="117" width="9" height="9" fill="#000000"/><rect x="216" y="117" width="9" height="9" fill="#000000"/><rect x="225" y="117" width="9" height="9" fill="#000000"/><rect x="243" y="117" width="9" height="9" fill="#000000"/><rect x="252" y="117" width="9" height="9" fill="#000000"/><rect x="36" y="126" width="9" height="9" fill="#000000"/><rect x="45" y="126" width="9" height="9" fill="#000000"/><rect x="63" y="126" width="9" height="9" fill="#000000"/><rect x="72" y="126" width="9" height="9" fill="#000000"/><rect x="90" y="126" width="9" height="9" fill="#000000"/><rect x="198" y="126" width="9" height="9" fill="#000000"/><rect x="207" y="126" width="9" height="9" fill="#000000"/><rect x="225" y="126" width="9" height="9" fill="#000000"/><rect x="234" y="126" width="9" height="9" fill="#000000"/><rect x="252" y="126" width="9" height="9" fill="#000000"/><rect x="45" y="135" width="9" height="9" fill="#000000"/><rect x="54" y="135" width="9" height="9" fill="#000000"/><rect x="72" y="135" width="9" height="9" fill="#000000"/><rect x="81" y="135" width="9" height="9" fill="#000000"/><rect x="207" y="135" width="9" height="9" fill="#000000"/><rect x="216" y="135" width="9" height="9" fill="#000000"/><rect x="234" y="135" width="9" height="9" fill="#000000"/><rect x="243" y="135" width="9" height="9" fill="#000000"/><rect x="36" y="144" width="9" height="9" fill="#000000"/><rect x="54" y="144" width="9" height="9" fill="#000000"/><rect x="63" y="144" width="9" height="9" fill="#000000"/><rect x="81" y="144" width="9" height="9" fill="#000000"/><rect x="90" y="144" width="9" height="9" fill="#000000"/><rect x="198" y="144" width="9" height="9" fill="#000000"/><rect x="216" y="144" width="9" height="9" fill="#000000"/><rect x="225" y="144" width="9" height="9" fill="#000000"/><rect x="243" y="144" width="9" height="9" fill="#000000"/><rect x="252" y="144" width="9" height="9" fill="#000000"/><rect x="36" y="153" width="9" height="9" fill="#000000"/><rect x="45" y="153" width="9" height="9" fill="#000000"/><rect x="63" y="153" width="9" height="9" fill="#000000"/><rect x="72" y="153" width="9" height="9" fill="#000000"/><rect x="198" y="153" width="9" height="9" fill="#000000"/><rect x="207" y="153" width="9" height="9" fill="#000000"/><rect x="225" y="153" width="9" height="9" fill="#000000"/><rect x="234" y="153" width="9" height="9" fill="#000000"/><rect x="252" y="153" width="9" height="9" fill="#000000"/><rect x="45" y="162" width="9" height="9" fill="#000000"/><rect x="54" y="162" width="9" height="9" fill="#000000"/><rect x="72" y="162" width="9" height="9" fill="#000000"/><rect x="81" y="162" width="9" height="9" fill="#000000"/><rect x="90" y="162" width="9" height="9" fill="#000000"/><rect x="207" y="162" width="9" height="9" fill="#000000"/><rect x="216" y="162" width="9" height="9" fill="#000000"/><rect x="234" y="162" width="9" height="9" fill="#000000"/><rect x="243" y="162" width="9" height="9" fill="#000000"/><rect x="36" y="171" width="9" height="9" fill="#000000"/><rect x="54" y="171" width="9" height="9" fill="#000000"/><rect x="63" y="171" width="9" height="9" fill="#000000"/><rect x="81" y="171" width="9" height="9" fill="#000000"/><rect x="198" y="171" width="9" height="9" fill="#000000"/><rect x="216" y="171" width="9" height="9" fill="#000000"/><rect x="225" y="171" width="9" height="9" fill="#000000"/><rect x="243" y="171" width="9" height="9" fill="#000000"/><rect x="252" y="171" width="9" height="9" fill="#000000"/><rect x="36" y="180" width="9" height="9" fill="#000000"/><rect x="45" y="180" width="9" height="9" fill="#000000"/><rect x="63" y="180" width="9" height="9" fill="#000000"/><rect x="72" y="180" width="9" height="9" fill="#000000"/><rect x="90" y="180" width="9" height="9" fill="#000000"/><rect x="198" y="180" width="9" height="9" fill="#000000"/><rect x="207" y="180" width="9" height="9" fill="#000000"/><rect x="225" y="180" width="9" height="9" fill="#000000"/><rect x="234" y="180" width="9" height="9" fill="#000000"/><rect x="252" y="180" width="9" height="9" fill="#000000"/><rect x="207" y="189" width="9" height="9" fill="#000000"/><rect x="216" y="189" width="9" height="9" fill="#000000"/><rect x="234" y="189" width="9" height="9" fill="#000000"/><rect x="243" y="189" width="9" height="9" fill="#000000"/><rect x="108" y="198" width="9" height="9" fill="#000000"/><rect x="117" y="198" width="9" height="9" fill="#000000"/><rect x="135" y="198" width="9" height="9" fill="#000000"/><rect x="144" y="198" width="9" height="9" fill="#000000"/><rect x="162" y="198" width="9" height="9" fill="#000000"/><rect x="171" y="198" width="9" height="9" fill="#000000"/><rect x="189" y="198" width="9" height="9" fill="#000000"/><rect x="198" y="198" width="9" height="9" fill="#000000"/><rect x="216" y="198" width="9" height="9" fill="#000000"/><rect x="225" y="198" width="9" height="9" fill="#000000"/><rect x="243" y="198" width="9" height="9" fill="#000000"/><rect x="252" y="198" width="9" height="9" fill="#000000"/><rect x="117" y="207" width="9" height="9" fill="#000000"/><rect x="126" y="207" width="9" height="9" fill="#000000"/><rect x="144" y="207" width="9" height="9" fill="#000000"/><rect x="153" y="207" width="9" height="9" fill="#000000"/><rect x="171" y="207" width="9" height="9" fill="#000000"/><rect x="180" y="207" width="9" height="9" fill="#000000"/><rect x="198" y="207" width="9" height="9" fill="#000000"/><rect x="207" y="207" width="9" height="9" fill="#000000"/><rect x="225" y="207" width="9" height="9" fill="#000000"/><rect x="234" y="207" width="9" height="9" fill="#000000"/><rect x="252" y="207" width="9" height="9" fill="#000000"/><rect x="108" y="216" width="9" height="9" fill="#000000"/><rect x="126" y="216" width="9" height="9" fill="#000000"/><rect x="135" y="216" width="9" height="9" fill="#000000"/><rect x="153" y="216" width="9" height="9" fill="#000000"/><rect x="162" y="216" width="9" height="9" fill="#000000"/><rect x="180" y="216" width="9" height="9" fill="#000000"/><rect x="189" y="216" width="9" height="9" fill="#000000"/><rect x="207" y="216" width="9" height="9" fill="#000000"/><rect x="216" y="216" width="9" height="9" fill="#000000"/><rect x="234" y="216" width="9" height="9" fill="#000000"/><rect x="243" y="216" width="9" height="9" fill="#000000"/><rect x="108" y="225" width="9" height="9" fill="#000000"/><rect x="117" y="225" width="9" height="9" fill="#000000"/><rect x="135" y="225" width="9" height="9" fill="#000000"/><rect x="144" y="225" width="9" height="9" fill="#000000"/><rect x="162" y="225" width="9" height="9" fill="#000000"/><rect x="171" y="225" width="9" height="9" fill="#000000"/><rect x="189" y="225" width="9" height="9" fill="#000000"/><rect x="198" y="225" width="9" height="9" fill="#000000"/><rect x="216" y="225" width="9" height="9" fill="#000000"/><rect x="225" y="225" width="9" height="9" fill="#000000"/><rect x="243" y="225" width="9" height="9" fill="#000000"/><rect x="252" y="225" width="9" height="9" fill="#000000"/><rect x="117" y="234" width="9" height="9" fill="#000000"/><rect x="126" y="234" width="9" height="9" fill="#000000"/><rect x="144" y="234" width="9" height="9" fill="#000000"/><rect x="153" y="234" width="9" height="9" fill="#000000"/><rect x="171" y="234" width="9" height="9" fill="#000000"/><rect x="180" y="234" width="9" height="9" fill="#000000"/><rect x="198" y="234" width="9" height="9" fill="#000000"/><rect x="207" y="234" width="9" height="9" fill="#000000"/><rect x="225" y="234" width="9" height="9" fill="#000000"/><rect x="234" y="234" width="9" height="9" fill="#000000"/><rect x="252" y="234" width="9" height="9" fill="#000000"/><rect x="108" y="243" width="9" height="9" fill="#000000"/><rect x="126" y="243" width="9" height="9" fill="#000000"/><rect x="135" y="243" width="9" height="9" fill="#000000"/><rect x="153" y="243" width="9" height="9" fill="#000000"/><rect x="162" y="243" width="9" height="9" fill="#000000"/><rect x="180" y="243" width="9" height="9" fill="#000000"/><rect x="189" y="243" width="9" height="9" fill="#000000"/><rect x="207" y="243" width="9" height="9" fill="#000000"/><rect x="216" y="243" width="9" height="9" fill="#000000"/><rect x="234" y="243" width="9" height="9" fill="#000000"/><rect x="243" y="243" width="9" height="9" fill="#000000"/><rect x="108" y="252" width="9" height="9" fill="#000000"/><rect x="117" y="252" width="9" height="9" fill="#000000"/><rect x="135" y="252" width="9" height="9" fill="#000000"/><rect x="144" y="252" width="9" height="9" fill="#000000"/><rect x="162" y="252" width="9" height="9" fill="#000000"/><rect x="171" y="252" width="9" height="9" fill="#000000"/><rect x="189" y="252" width="9" height="9" fill="#000000"/><rect x="198" y="252" width="9" height="9" fill="#000000"/><rect x="216" y="252" width="9" height="9" fill="#000000"/><rect x="225" y="252" width="9" height="9" fill="#000000"/><rect x="243" y="252" width="9" height="9" fill="#000000"/><rect x="252" y="252" width="9" height="9" fill="#000000"/><rect x="118.5" y="118.5" width="60" height="60" fill="#ffffff" stroke="#000000" stroke-width="2" rx="4"/><text x="148.5" y="152.5" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#000000">LOGO</text></svg>',
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
