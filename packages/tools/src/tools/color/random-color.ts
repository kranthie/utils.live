import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { rgbToHex, rgbToHsl } from "./color-utils";

const inputSchema = z.object({
  count: z
    .number()
    .min(1)
    .max(50)
    .default(5)
    .describe("Number of colors to generate"),
  format: z
    .enum(["hex", "rgb", "hsl"])
    .default("hex")
    .describe("Output format"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated random colors"),
});

export const randomColor = defineTool({
  meta: {
    id: "color/random-color",
    name: "Random Color Generator",
    description:
      "Free online random color generator — generate random colors in hex, RGB, or HSL format instantly in your browser. No data is stored. Configurable count from 1 to 50 colors.",
    category: "color",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["random", "color", "generate", "hex", "rgb", "hsl"],
    examples: [
      {
        title: "Generate 3 Hex Colors",
        description: "Generate 3 random colors in hex format",
        input: { count: 3, format: "hex" },
        output: "#A3F2C1\n#5B8DEF\n#FF6B9A",
      },
      {
        title: "Generate RGB Colors",
        description: "Generate 2 random colors in RGB format",
        input: { count: 2, format: "rgb" },
        output: "rgb(163, 242, 193)\nrgb(91, 141, 239)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const count = input.count ?? 5;
    const format = input.format ?? "hex";
    const colors: string[] = [];
    const buf = new Uint8Array(3);
    for (let i = 0; i < count; i++) {
      crypto.getRandomValues(buf);
      const r = buf[0]!;
      const g = buf[1]!;
      const b = buf[2]!;
      switch (format) {
        case "hex":
          colors.push(rgbToHex({ r, g, b }));
          break;
        case "rgb":
          colors.push(`rgb(${r}, ${g}, ${b})`);
          break;
        case "hsl": {
          const hsl = rgbToHsl({ r, g, b });
          colors.push(
            `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`
          );
          break;
        }
      }
    }
    return { output: colors.join("\n") };
  },
});
