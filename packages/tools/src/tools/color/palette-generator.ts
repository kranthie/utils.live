import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { hslToRgb, rgbToHex } from "./color-utils";

const inputSchema = z.object({
  count: z.number().min(2).max(20).default(5).describe("Number of colors"),
  hue: z.number().min(0).max(360).default(200).describe("Base hue (0-360)"),
  saturation: z
    .number()
    .min(0)
    .max(100)
    .default(70)
    .describe("Saturation (0-100)"),
  lightness: z
    .number()
    .min(0)
    .max(100)
    .default(50)
    .describe("Base lightness (0-100)"),
  harmony: z
    .enum(["analogous", "complementary", "triadic", "monochromatic"])
    .default("analogous")
    .describe("Color harmony"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated palette"),
});

export const paletteGenerator = defineTool({
  meta: {
    id: "color/palette-generator",
    name: "Palette Generator",
    description:
      "Free online color palette generator — create harmonious color palettes using analogous, complementary, triadic, or monochromatic color harmony rules instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: [
      "palette",
      "generate",
      "harmony",
      "color",
      "scheme",
      "analogous",
      "complementary",
      "triadic",
      "monochromatic",
    ],
    examples: [
      {
        title: "Analogous Palette",
        description: "Generate 5 analogous colors based on a blue hue",
        input: {
          count: 5,
          hue: 210,
          saturation: 70,
          lightness: 50,
          harmony: "analogous",
        },
        output: "#26D980\n#26D9D9\n#267FD9\n#2626D9\n#7F26D9",
      },
      {
        title: "Monochromatic Palette",
        description: "Generate monochromatic variations of red",
        input: {
          count: 5,
          hue: 0,
          saturation: 80,
          lightness: 50,
          harmony: "monochromatic",
        },
        output: "#5C0A0A\n#A11212\n#E61919\n#ED5E5E\n#F5A3A3",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const count = input.count ?? 5;
    const baseHue = input.hue ?? 200;
    const s = (input.saturation ?? 70) / 100;
    const l = (input.lightness ?? 50) / 100;
    const harmony = input.harmony ?? "analogous";
    const colors: string[] = [];

    switch (harmony) {
      case "analogous":
        for (let i = 0; i < count; i++) {
          const h = (baseHue + (i - Math.floor(count / 2)) * 30) % 360;
          colors.push(rgbToHex(hslToRgb({ h: h < 0 ? h + 360 : h, s, l })));
        }
        break;
      case "complementary":
        for (let i = 0; i < count; i++) {
          const t = i / (count - 1);
          const h = (baseHue + t * 180) % 360;
          colors.push(rgbToHex(hslToRgb({ h, s, l })));
        }
        break;
      case "triadic":
        for (let i = 0; i < count; i++) {
          const h = (baseHue + (i * 120) / Math.ceil(count / 3)) % 360;
          colors.push(rgbToHex(hslToRgb({ h, s, l })));
        }
        break;
      case "monochromatic":
        for (let i = 0; i < count; i++) {
          const lightness = 0.2 + (0.6 * i) / (count - 1);
          colors.push(rgbToHex(hslToRgb({ h: baseHue, s, l: lightness })));
        }
        break;
    }
    return { output: colors.join("\n") };
  },
});
