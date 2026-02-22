import { z } from "zod";
import QRCode from "qrcode";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z
    .string()
    .max(4296)
    .default("")
    .describe("Text or URL to encode as QR code"),
  size: z
    .number()
    .min(100)
    .max(1000)
    .default(200)
    .describe("QR code size in pixels"),
  errorCorrection: z
    .enum(["L", "M", "Q", "H"])
    .default("M")
    .describe("Error correction level (L=7%, M=15%, Q=25%, H=30%)"),
  darkColor: z.string().default("#000000").describe("Dark module color"),
  lightColor: z.string().default("#ffffff").describe("Light module color"),
});

const outputSchema = z.object({
  output: z.string().describe("QR code as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Convert the QR code module data from the qrcode library into an SVG string.
 */
function modulesToSvg(
  modules: { data: Uint8Array; size: number },
  size: number,
  darkColor: string,
  lightColor: string
): string {
  const moduleCount = modules.size;
  const moduleSize = Math.max(1, Math.floor(size / (moduleCount + 8)));
  const quietZone = moduleSize * 4;
  const totalSize = moduleCount * moduleSize + quietZone * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}">`;
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}"/>`;

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules.data[row * moduleCount + col]) {
        svg += `<rect x="${quietZone + col * moduleSize}" y="${quietZone + row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  svg += "</svg>";
  return svg;
}

function execute(input: Input): Output {
  if (!input.text) {
    return { output: "" };
  }

  const qr = QRCode.create(input.text, {
    errorCorrectionLevel: input.errorCorrection,
  });

  const svg = modulesToSvg(
    qr.modules,
    input.size,
    input.darkColor,
    input.lightColor
  );

  return { output: svg };
}

export const qrCodeGenerator = defineTool({
  meta: {
    id: "diagram/qr-code-generator",
    name: "QR Code Generator",
    description:
      "Free online QR code generator — create QR codes as SVG from text or URLs with customizable size, colors, and error correction instantly in your browser. No data is stored. Supports L/M/Q/H error correction levels.",
    category: "diagram",
    subgroup: "QR Codes",
    tier: ToolTier.CLIENT,
    keywords: ["qr", "code", "barcode", "generate", "svg"],
    examples: [
      {
        title: "URL QR Code",
        description: "Generate a QR code for a website URL",
        input: {
          text: "https://example.com",
          size: 200,
          errorCorrection: "M",
          darkColor: "#000000",
          lightColor: "#ffffff",
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 198 198" width="200" height="200"><rect width="198" height="198" fill="#ffffff"/><rect x="24" y="24" width="6" height="6" fill="#000000"/><rect x="30" y="24" width="6" height="6" fill="#000000"/><rect x="36" y="24" width="6" height="6" fill="#000000"/><rect x="42" y="24" width="6" height="6" fill="#000000"/><rect x="48" y="24" width="6" height="6" fill="#000000"/><rect x="54" y="24" width="6" height="6" fill="#000000"/><rect x="60" y="24" width="6" height="6" fill="#000000"/><rect x="90" y="24" width="6" height="6" fill="#000000"/><rect x="96" y="24" width="6" height="6" fill="#000000"/><rect x="102" y="24" width="6" height="6" fill="#000000"/><rect x="120" y="24" width="6" height="6" fill="#000000"/><rect x="132" y="24" width="6" height="6" fill="#000000"/><rect x="138" y="24" width="6" height="6" fill="#000000"/><rect x="144" y="24" width="6" height="6" fill="#000000"/><rect x="150" y="24" width="6" height="6" fill="#000000"/><rect x="156" y="24" width="6" height="6" fill="#000000"/><rect x="162" y="24" width="6" height="6" fill="#000000"/><rect x="168" y="24" width="6" height="6" fill="#000000"/><rect x="24" y="30" width="6" height="6" fill="#000000"/><rect x="60" y="30" width="6" height="6" fill="#000000"/><rect x="84" y="30" width="6" height="6" fill="#000000"/><rect x="102" y="30" width="6" height="6" fill="#000000"/><rect x="108" y="30" width="6" height="6" fill="#000000"/><rect x="114" y="30" width="6" height="6" fill="#000000"/><rect x="120" y="30" width="6" height="6" fill="#000000"/><rect x="132" y="30" width="6" height="6" fill="#000000"/><rect x="168" y="30" width="6" height="6" fill="#000000"/><rect x="24" y="36" width="6" height="6" fill="#000000"/><rect x="36" y="36" width="6" height="6" fill="#000000"/><rect x="42" y="36" width="6" height="6" fill="#000000"/><rect x="48" y="36" width="6" height="6" fill="#000000"/><rect x="60" y="36" width="6" height="6" fill="#000000"/><rect x="72" y="36" width="6" height="6" fill="#000000"/><rect x="78" y="36" width="6" height="6" fill="#000000"/><rect x="90" y="36" width="6" height="6" fill="#000000"/><rect x="108" y="36" width="6" height="6" fill="#000000"/><rect x="132" y="36" width="6" height="6" fill="#000000"/><rect x="144" y="36" width="6" height="6" fill="#000000"/><rect x="150" y="36" width="6" height="6" fill="#000000"/><rect x="156" y="36" width="6" height="6" fill="#000000"/><rect x="168" y="36" width="6" height="6" fill="#000000"/><rect x="24" y="42" width="6" height="6" fill="#000000"/><rect x="36" y="42" width="6" height="6" fill="#000000"/><rect x="42" y="42" width="6" height="6" fill="#000000"/><rect x="48" y="42" width="6" height="6" fill="#000000"/><rect x="60" y="42" width="6" height="6" fill="#000000"/><rect x="72" y="42" width="6" height="6" fill="#000000"/><rect x="102" y="42" width="6" height="6" fill="#000000"/><rect x="108" y="42" width="6" height="6" fill="#000000"/><rect x="114" y="42" width="6" height="6" fill="#000000"/><rect x="132" y="42" width="6" height="6" fill="#000000"/><rect x="144" y="42" width="6" height="6" fill="#000000"/><rect x="150" y="42" width="6" height="6" fill="#000000"/><rect x="156" y="42" width="6" height="6" fill="#000000"/><rect x="168" y="42" width="6" height="6" fill="#000000"/><rect x="24" y="48" width="6" height="6" fill="#000000"/><rect x="36" y="48" width="6" height="6" fill="#000000"/><rect x="42" y="48" width="6" height="6" fill="#000000"/><rect x="48" y="48" width="6" height="6" fill="#000000"/><rect x="60" y="48" width="6" height="6" fill="#000000"/><rect x="72" y="48" width="6" height="6" fill="#000000"/><rect x="78" y="48" width="6" height="6" fill="#000000"/><rect x="84" y="48" width="6" height="6" fill="#000000"/><rect x="102" y="48" width="6" height="6" fill="#000000"/><rect x="120" y="48" width="6" height="6" fill="#000000"/><rect x="132" y="48" width="6" height="6" fill="#000000"/><rect x="144" y="48" width="6" height="6" fill="#000000"/><rect x="150" y="48" width="6" height="6" fill="#000000"/><rect x="156" y="48" width="6" height="6" fill="#000000"/><rect x="168" y="48" width="6" height="6" fill="#000000"/><rect x="24" y="54" width="6" height="6" fill="#000000"/><rect x="60" y="54" width="6" height="6" fill="#000000"/><rect x="72" y="54" width="6" height="6" fill="#000000"/><rect x="90" y="54" width="6" height="6" fill="#000000"/><rect x="108" y="54" width="6" height="6" fill="#000000"/><rect x="114" y="54" width="6" height="6" fill="#000000"/><rect x="132" y="54" width="6" height="6" fill="#000000"/><rect x="168" y="54" width="6" height="6" fill="#000000"/><rect x="24" y="60" width="6" height="6" fill="#000000"/><rect x="30" y="60" width="6" height="6" fill="#000000"/><rect x="36" y="60" width="6" height="6" fill="#000000"/><rect x="42" y="60" width="6" height="6" fill="#000000"/><rect x="48" y="60" width="6" height="6" fill="#000000"/><rect x="54" y="60" width="6" height="6" fill="#000000"/><rect x="60" y="60" width="6" height="6" fill="#000000"/><rect x="72" y="60" width="6" height="6" fill="#000000"/><rect x="84" y="60" width="6" height="6" fill="#000000"/><rect x="96" y="60" width="6" height="6" fill="#000000"/><rect x="108" y="60" width="6" height="6" fill="#000000"/><rect x="120" y="60" width="6" height="6" fill="#000000"/><rect x="132" y="60" width="6" height="6" fill="#000000"/><rect x="138" y="60" width="6" height="6" fill="#000000"/><rect x="144" y="60" width="6" height="6" fill="#000000"/><rect x="150" y="60" width="6" height="6" fill="#000000"/><rect x="156" y="60" width="6" height="6" fill="#000000"/><rect x="162" y="60" width="6" height="6" fill="#000000"/><rect x="168" y="60" width="6" height="6" fill="#000000"/><rect x="72" y="66" width="6" height="6" fill="#000000"/><rect x="108" y="66" width="6" height="6" fill="#000000"/><rect x="120" y="66" width="6" height="6" fill="#000000"/><rect x="24" y="72" width="6" height="6" fill="#000000"/><rect x="36" y="72" width="6" height="6" fill="#000000"/><rect x="42" y="72" width="6" height="6" fill="#000000"/><rect x="48" y="72" width="6" height="6" fill="#000000"/><rect x="54" y="72" width="6" height="6" fill="#000000"/><rect x="60" y="72" width="6" height="6" fill="#000000"/><rect x="96" y="72" width="6" height="6" fill="#000000"/><rect x="132" y="72" width="6" height="6" fill="#000000"/><rect x="138" y="72" width="6" height="6" fill="#000000"/><rect x="144" y="72" width="6" height="6" fill="#000000"/><rect x="150" y="72" width="6" height="6" fill="#000000"/><rect x="156" y="72" width="6" height="6" fill="#000000"/><rect x="30" y="78" width="6" height="6" fill="#000000"/><rect x="48" y="78" width="6" height="6" fill="#000000"/><rect x="54" y="78" width="6" height="6" fill="#000000"/><rect x="72" y="78" width="6" height="6" fill="#000000"/><rect x="84" y="78" width="6" height="6" fill="#000000"/><rect x="90" y="78" width="6" height="6" fill="#000000"/><rect x="102" y="78" width="6" height="6" fill="#000000"/><rect x="126" y="78" width="6" height="6" fill="#000000"/><rect x="138" y="78" width="6" height="6" fill="#000000"/><rect x="162" y="78" width="6" height="6" fill="#000000"/><rect x="24" y="84" width="6" height="6" fill="#000000"/><rect x="30" y="84" width="6" height="6" fill="#000000"/><rect x="36" y="84" width="6" height="6" fill="#000000"/><rect x="42" y="84" width="6" height="6" fill="#000000"/><rect x="48" y="84" width="6" height="6" fill="#000000"/><rect x="60" y="84" width="6" height="6" fill="#000000"/><rect x="72" y="84" width="6" height="6" fill="#000000"/><rect x="78" y="84" width="6" height="6" fill="#000000"/><rect x="102" y="84" width="6" height="6" fill="#000000"/><rect x="108" y="84" width="6" height="6" fill="#000000"/><rect x="114" y="84" width="6" height="6" fill="#000000"/><rect x="120" y="84" width="6" height="6" fill="#000000"/><rect x="138" y="84" width="6" height="6" fill="#000000"/><rect x="150" y="84" width="6" height="6" fill="#000000"/><rect x="162" y="84" width="6" height="6" fill="#000000"/><rect x="168" y="84" width="6" height="6" fill="#000000"/><rect x="24" y="90" width="6" height="6" fill="#000000"/><rect x="30" y="90" width="6" height="6" fill="#000000"/><rect x="42" y="90" width="6" height="6" fill="#000000"/><rect x="48" y="90" width="6" height="6" fill="#000000"/><rect x="54" y="90" width="6" height="6" fill="#000000"/><rect x="72" y="90" width="6" height="6" fill="#000000"/><rect x="84" y="90" width="6" height="6" fill="#000000"/><rect x="90" y="90" width="6" height="6" fill="#000000"/><rect x="102" y="90" width="6" height="6" fill="#000000"/><rect x="114" y="90" width="6" height="6" fill="#000000"/><rect x="120" y="90" width="6" height="6" fill="#000000"/><rect x="132" y="90" width="6" height="6" fill="#000000"/><rect x="138" y="90" width="6" height="6" fill="#000000"/><rect x="168" y="90" width="6" height="6" fill="#000000"/><rect x="30" y="96" width="6" height="6" fill="#000000"/><rect x="36" y="96" width="6" height="6" fill="#000000"/><rect x="42" y="96" width="6" height="6" fill="#000000"/><rect x="60" y="96" width="6" height="6" fill="#000000"/><rect x="90" y="96" width="6" height="6" fill="#000000"/><rect x="96" y="96" width="6" height="6" fill="#000000"/><rect x="108" y="96" width="6" height="6" fill="#000000"/><rect x="114" y="96" width="6" height="6" fill="#000000"/><rect x="126" y="96" width="6" height="6" fill="#000000"/><rect x="132" y="96" width="6" height="6" fill="#000000"/><rect x="144" y="96" width="6" height="6" fill="#000000"/><rect x="156" y="96" width="6" height="6" fill="#000000"/><rect x="162" y="96" width="6" height="6" fill="#000000"/><rect x="168" y="96" width="6" height="6" fill="#000000"/><rect x="24" y="102" width="6" height="6" fill="#000000"/><rect x="30" y="102" width="6" height="6" fill="#000000"/><rect x="36" y="102" width="6" height="6" fill="#000000"/><rect x="42" y="102" width="6" height="6" fill="#000000"/><rect x="48" y="102" width="6" height="6" fill="#000000"/><rect x="72" y="102" width="6" height="6" fill="#000000"/><rect x="84" y="102" width="6" height="6" fill="#000000"/><rect x="120" y="102" width="6" height="6" fill="#000000"/><rect x="138" y="102" width="6" height="6" fill="#000000"/><rect x="150" y="102" width="6" height="6" fill="#000000"/><rect x="162" y="102" width="6" height="6" fill="#000000"/><rect x="24" y="108" width="6" height="6" fill="#000000"/><rect x="60" y="108" width="6" height="6" fill="#000000"/><rect x="66" y="108" width="6" height="6" fill="#000000"/><rect x="84" y="108" width="6" height="6" fill="#000000"/><rect x="90" y="108" width="6" height="6" fill="#000000"/><rect x="96" y="108" width="6" height="6" fill="#000000"/><rect x="114" y="108" width="6" height="6" fill="#000000"/><rect x="132" y="108" width="6" height="6" fill="#000000"/><rect x="138" y="108" width="6" height="6" fill="#000000"/><rect x="144" y="108" width="6" height="6" fill="#000000"/><rect x="150" y="108" width="6" height="6" fill="#000000"/><rect x="162" y="108" width="6" height="6" fill="#000000"/><rect x="168" y="108" width="6" height="6" fill="#000000"/><rect x="24" y="114" width="6" height="6" fill="#000000"/><rect x="42" y="114" width="6" height="6" fill="#000000"/><rect x="66" y="114" width="6" height="6" fill="#000000"/><rect x="90" y="114" width="6" height="6" fill="#000000"/><rect x="108" y="114" width="6" height="6" fill="#000000"/><rect x="114" y="114" width="6" height="6" fill="#000000"/><rect x="120" y="114" width="6" height="6" fill="#000000"/><rect x="126" y="114" width="6" height="6" fill="#000000"/><rect x="132" y="114" width="6" height="6" fill="#000000"/><rect x="138" y="114" width="6" height="6" fill="#000000"/><rect x="144" y="114" width="6" height="6" fill="#000000"/><rect x="168" y="114" width="6" height="6" fill="#000000"/><rect x="24" y="120" width="6" height="6" fill="#000000"/><rect x="36" y="120" width="6" height="6" fill="#000000"/><rect x="54" y="120" width="6" height="6" fill="#000000"/><rect x="60" y="120" width="6" height="6" fill="#000000"/><rect x="72" y="120" width="6" height="6" fill="#000000"/><rect x="78" y="120" width="6" height="6" fill="#000000"/><rect x="84" y="120" width="6" height="6" fill="#000000"/><rect x="90" y="120" width="6" height="6" fill="#000000"/><rect x="120" y="120" width="6" height="6" fill="#000000"/><rect x="126" y="120" width="6" height="6" fill="#000000"/><rect x="132" y="120" width="6" height="6" fill="#000000"/><rect x="138" y="120" width="6" height="6" fill="#000000"/><rect x="144" y="120" width="6" height="6" fill="#000000"/><rect x="156" y="120" width="6" height="6" fill="#000000"/><rect x="72" y="126" width="6" height="6" fill="#000000"/><rect x="78" y="126" width="6" height="6" fill="#000000"/><rect x="96" y="126" width="6" height="6" fill="#000000"/><rect x="102" y="126" width="6" height="6" fill="#000000"/><rect x="108" y="126" width="6" height="6" fill="#000000"/><rect x="114" y="126" width="6" height="6" fill="#000000"/><rect x="120" y="126" width="6" height="6" fill="#000000"/><rect x="144" y="126" width="6" height="6" fill="#000000"/><rect x="150" y="126" width="6" height="6" fill="#000000"/><rect x="24" y="132" width="6" height="6" fill="#000000"/><rect x="30" y="132" width="6" height="6" fill="#000000"/><rect x="36" y="132" width="6" height="6" fill="#000000"/><rect x="42" y="132" width="6" height="6" fill="#000000"/><rect x="48" y="132" width="6" height="6" fill="#000000"/><rect x="54" y="132" width="6" height="6" fill="#000000"/><rect x="60" y="132" width="6" height="6" fill="#000000"/><rect x="102" y="132" width="6" height="6" fill="#000000"/><rect x="108" y="132" width="6" height="6" fill="#000000"/><rect x="120" y="132" width="6" height="6" fill="#000000"/><rect x="132" y="132" width="6" height="6" fill="#000000"/><rect x="144" y="132" width="6" height="6" fill="#000000"/><rect x="156" y="132" width="6" height="6" fill="#000000"/><rect x="162" y="132" width="6" height="6" fill="#000000"/><rect x="168" y="132" width="6" height="6" fill="#000000"/><rect x="24" y="138" width="6" height="6" fill="#000000"/><rect x="60" y="138" width="6" height="6" fill="#000000"/><rect x="72" y="138" width="6" height="6" fill="#000000"/><rect x="78" y="138" width="6" height="6" fill="#000000"/><rect x="96" y="138" width="6" height="6" fill="#000000"/><rect x="102" y="138" width="6" height="6" fill="#000000"/><rect x="120" y="138" width="6" height="6" fill="#000000"/><rect x="144" y="138" width="6" height="6" fill="#000000"/><rect x="150" y="138" width="6" height="6" fill="#000000"/><rect x="162" y="138" width="6" height="6" fill="#000000"/><rect x="24" y="144" width="6" height="6" fill="#000000"/><rect x="36" y="144" width="6" height="6" fill="#000000"/><rect x="42" y="144" width="6" height="6" fill="#000000"/><rect x="48" y="144" width="6" height="6" fill="#000000"/><rect x="60" y="144" width="6" height="6" fill="#000000"/><rect x="72" y="144" width="6" height="6" fill="#000000"/><rect x="78" y="144" width="6" height="6" fill="#000000"/><rect x="84" y="144" width="6" height="6" fill="#000000"/><rect x="96" y="144" width="6" height="6" fill="#000000"/><rect x="108" y="144" width="6" height="6" fill="#000000"/><rect x="114" y="144" width="6" height="6" fill="#000000"/><rect x="120" y="144" width="6" height="6" fill="#000000"/><rect x="126" y="144" width="6" height="6" fill="#000000"/><rect x="132" y="144" width="6" height="6" fill="#000000"/><rect x="138" y="144" width="6" height="6" fill="#000000"/><rect x="144" y="144" width="6" height="6" fill="#000000"/><rect x="156" y="144" width="6" height="6" fill="#000000"/><rect x="168" y="144" width="6" height="6" fill="#000000"/><rect x="24" y="150" width="6" height="6" fill="#000000"/><rect x="36" y="150" width="6" height="6" fill="#000000"/><rect x="42" y="150" width="6" height="6" fill="#000000"/><rect x="48" y="150" width="6" height="6" fill="#000000"/><rect x="60" y="150" width="6" height="6" fill="#000000"/><rect x="72" y="150" width="6" height="6" fill="#000000"/><rect x="114" y="150" width="6" height="6" fill="#000000"/><rect x="126" y="150" width="6" height="6" fill="#000000"/><rect x="132" y="150" width="6" height="6" fill="#000000"/><rect x="144" y="150" width="6" height="6" fill="#000000"/><rect x="150" y="150" width="6" height="6" fill="#000000"/><rect x="156" y="150" width="6" height="6" fill="#000000"/><rect x="162" y="150" width="6" height="6" fill="#000000"/><rect x="168" y="150" width="6" height="6" fill="#000000"/><rect x="24" y="156" width="6" height="6" fill="#000000"/><rect x="36" y="156" width="6" height="6" fill="#000000"/><rect x="42" y="156" width="6" height="6" fill="#000000"/><rect x="48" y="156" width="6" height="6" fill="#000000"/><rect x="60" y="156" width="6" height="6" fill="#000000"/><rect x="72" y="156" width="6" height="6" fill="#000000"/><rect x="78" y="156" width="6" height="6" fill="#000000"/><rect x="84" y="156" width="6" height="6" fill="#000000"/><rect x="90" y="156" width="6" height="6" fill="#000000"/><rect x="96" y="156" width="6" height="6" fill="#000000"/><rect x="114" y="156" width="6" height="6" fill="#000000"/><rect x="150" y="156" width="6" height="6" fill="#000000"/><rect x="156" y="156" width="6" height="6" fill="#000000"/><rect x="168" y="156" width="6" height="6" fill="#000000"/><rect x="24" y="162" width="6" height="6" fill="#000000"/><rect x="60" y="162" width="6" height="6" fill="#000000"/><rect x="90" y="162" width="6" height="6" fill="#000000"/><rect x="108" y="162" width="6" height="6" fill="#000000"/><rect x="120" y="162" width="6" height="6" fill="#000000"/><rect x="126" y="162" width="6" height="6" fill="#000000"/><rect x="138" y="162" width="6" height="6" fill="#000000"/><rect x="144" y="162" width="6" height="6" fill="#000000"/><rect x="150" y="162" width="6" height="6" fill="#000000"/><rect x="168" y="162" width="6" height="6" fill="#000000"/><rect x="24" y="168" width="6" height="6" fill="#000000"/><rect x="30" y="168" width="6" height="6" fill="#000000"/><rect x="36" y="168" width="6" height="6" fill="#000000"/><rect x="42" y="168" width="6" height="6" fill="#000000"/><rect x="48" y="168" width="6" height="6" fill="#000000"/><rect x="54" y="168" width="6" height="6" fill="#000000"/><rect x="60" y="168" width="6" height="6" fill="#000000"/><rect x="72" y="168" width="6" height="6" fill="#000000"/><rect x="78" y="168" width="6" height="6" fill="#000000"/><rect x="90" y="168" width="6" height="6" fill="#000000"/><rect x="126" y="168" width="6" height="6" fill="#000000"/><rect x="132" y="168" width="6" height="6" fill="#000000"/><rect x="138" y="168" width="6" height="6" fill="#000000"/><rect x="144" y="168" width="6" height="6" fill="#000000"/><rect x="150" y="168" width="6" height="6" fill="#000000"/><rect x="156" y="168" width="6" height="6" fill="#000000"/><rect x="162" y="168" width="6" height="6" fill="#000000"/><rect x="168" y="168" width="6" height="6" fill="#000000"/></svg>',
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
