import { z } from "zod";
import QRCode from "qrcode";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z.string().min(1).max(4296).describe("Text or URL to encode"),
  size: z
    .number()
    .min(100)
    .max(1000)
    .default(250)
    .describe("QR code size in pixels"),
  foreground: z.string().default("#000000").describe("Foreground color"),
  background: z.string().default("#ffffff").describe("Background color"),
  moduleShape: z
    .enum(["square", "rounded", "dots", "diamond"])
    .default("square")
    .describe("Module shape style"),
  finderShape: z
    .enum(["square", "rounded", "circle"])
    .default("square")
    .describe("Finder pattern shape"),
});

const outputSchema = z.object({
  output: z.string().describe("Styled QR code as SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function isFinderModule(
  row: number,
  col: number,
  moduleCount: number
): boolean {
  return (
    (row < 7 && col < 7) ||
    (row < 7 && col >= moduleCount - 7) ||
    (row >= moduleCount - 7 && col < 7)
  );
}

function execute(input: Input): Output {
  const qr = QRCode.create(input.text, { errorCorrectionLevel: "M" });
  const moduleCount = qr.modules.size;
  const moduleSize = Math.max(1, Math.floor(input.size / (moduleCount + 8)));
  const quietZone = moduleSize * 4;
  const totalSize = moduleCount * moduleSize + quietZone * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${input.size}" height="${input.size}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${input.background}"/>`;

  function drawModule(x: number, y: number, size: number): string {
    switch (input.moduleShape) {
      case "rounded":
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.3}" fill="${input.foreground}"/>`;
      case "dots":
        return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.4}" fill="${input.foreground}"/>`;
      case "diamond": {
        const cx = x + size / 2;
        const cy = y + size / 2;
        const h = size * 0.45;
        return `<polygon points="${cx},${cy - h} ${cx + h},${cy} ${cx},${cy + h} ${cx - h},${cy}" fill="${input.foreground}"/>`;
      }
      default:
        return `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${input.foreground}"/>`;
    }
  }

  function drawFinderPattern(px: number, py: number): string {
    let p = "";
    const s = moduleSize;
    if (input.finderShape === "circle") {
      p += `<circle cx="${px + 3.5 * s}" cy="${py + 3.5 * s}" r="${3.5 * s}" fill="${input.foreground}"/>`;
      p += `<circle cx="${px + 3.5 * s}" cy="${py + 3.5 * s}" r="${2.5 * s}" fill="${input.background}"/>`;
      p += `<circle cx="${px + 3.5 * s}" cy="${py + 3.5 * s}" r="${1.5 * s}" fill="${input.foreground}"/>`;
    } else if (input.finderShape === "rounded") {
      const r = s;
      p += `<rect x="${px}" y="${py}" width="${7 * s}" height="${7 * s}" rx="${r}" fill="${input.foreground}"/>`;
      p += `<rect x="${px + s}" y="${py + s}" width="${5 * s}" height="${5 * s}" rx="${r * 0.7}" fill="${input.background}"/>`;
      p += `<rect x="${px + 2 * s}" y="${py + 2 * s}" width="${3 * s}" height="${3 * s}" rx="${r * 0.5}" fill="${input.foreground}"/>`;
    } else {
      p += `<rect x="${px}" y="${py}" width="${7 * s}" height="${7 * s}" fill="${input.foreground}"/>`;
      p += `<rect x="${px + s}" y="${py + s}" width="${5 * s}" height="${5 * s}" fill="${input.background}"/>`;
      p += `<rect x="${px + 2 * s}" y="${py + 2 * s}" width="${3 * s}" height="${3 * s}" fill="${input.foreground}"/>`;
    }
    return p;
  }

  // Draw finder patterns using styled shapes
  svg += drawFinderPattern(quietZone, quietZone);
  svg += drawFinderPattern(
    quietZone + (moduleCount - 7) * moduleSize,
    quietZone
  );
  svg += drawFinderPattern(
    quietZone,
    quietZone + (moduleCount - 7) * moduleSize
  );

  // Draw data modules using real QR data with styled shapes
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      // Skip finder pattern areas (drawn above with custom shapes)
      if (isFinderModule(row, col, moduleCount)) continue;

      if (qr.modules.data[row * moduleCount + col]) {
        svg += drawModule(
          quietZone + col * moduleSize,
          quietZone + row * moduleSize,
          moduleSize
        );
      }
    }
  }

  svg += "</svg>";
  return { output: svg };
}

export const styledQrCode = defineTool({
  meta: {
    id: "diagram/styled-qr-code",
    name: "Styled QR Code",
    description:
      "Free online styled QR code generator — create QR codes as SVG with customizable module shapes, finder patterns, and colors instantly in your browser. No data is stored. Supports dots, rounded, and diamond module styles.",
    category: "diagram",
    subgroup: "QR Codes",
    tier: ToolTier.CLIENT,
    keywords: ["qr", "code", "styled", "custom", "colors", "design"],
    examples: [
      {
        title: "Rounded QR Code",
        description: "Generate a styled QR code with rounded modules",
        input: {
          text: "Hello World",
          size: 250,
          foreground: "#2C3E50",
          background: "#ECF0F1",
          moduleShape: "rounded",
          finderShape: "rounded",
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 232 232" width="250" height="250"><rect width="232" height="232" fill="#ECF0F1"/><rect x="32" y="32" width="56" height="56" rx="8" fill="#2C3E50"/><rect x="40" y="40" width="40" height="40" rx="5.6" fill="#ECF0F1"/><rect x="48" y="48" width="24" height="24" rx="4" fill="#2C3E50"/><rect x="144" y="32" width="56" height="56" rx="8" fill="#2C3E50"/><rect x="152" y="40" width="40" height="40" rx="5.6" fill="#ECF0F1"/><rect x="160" y="48" width="24" height="24" rx="4" fill="#2C3E50"/><rect x="32" y="144" width="56" height="56" rx="8" fill="#2C3E50"/><rect x="40" y="152" width="40" height="40" rx="5.6" fill="#ECF0F1"/><rect x="48" y="160" width="24" height="24" rx="4" fill="#2C3E50"/><rect x="112" y="32" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="32" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="40" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="40" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="48" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="48" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="48" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="56" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="56" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="56" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="56" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="64" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="64" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="72" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="72" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="72" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="80" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="80" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="80" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="88" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="88" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="32" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="48" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="56" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="64" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="72" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="80" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="96" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="32" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="56" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="64" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="72" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="192" y="104" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="40" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="48" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="56" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="64" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="80" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="88" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="184" y="112" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="32" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="48" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="64" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="120" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="40" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="48" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="80" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="192" y="128" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="136" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="136" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="136" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="136" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="144" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="144" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="144" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="184" y="144" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="184" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="192" y="152" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="160" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="160" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="160" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="160" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="192" y="160" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="168" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="176" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="104" y="176" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="176" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="152" y="176" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="176" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="136" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="168" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="176" y="184" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="96" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="112" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="120" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="128" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="144" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="160" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/><rect x="184" y="192" width="8" height="8" rx="2.4" fill="#2C3E50"/></svg>',
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
