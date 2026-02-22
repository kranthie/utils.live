import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { parseHex } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("Hex color (e.g., '#FF5733')"),
});
const outputSchema = z.object({
  output: z.string().describe("RGB color value"),
});

export const hexToRgb = defineTool({
  meta: {
    id: "color/hex-to-rgb",
    name: "Hex to RGB",
    description:
      "Free online hex to RGB converter — convert hex color codes to RGB (red, green, blue) values instantly in your browser. No data is stored.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["hex", "rgb", "color", "convert"],
    examples: [
      {
        title: "Convert Coral",
        description: "Convert a coral hex color to RGB",
        input: "#FF6B6B",
        output: "rgb(255, 107, 107)",
      },
      {
        title: "Convert Navy",
        description: "Convert a dark navy hex to RGB",
        input: "#1A1A2E",
        output: "rgb(26, 26, 46)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const { r, g, b } = parseHex(input.input);
    return { output: `rgb(${r}, ${g}, ${b})` };
  },
});
