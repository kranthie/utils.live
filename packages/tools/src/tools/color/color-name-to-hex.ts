import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { CSS_COLORS } from "./color-utils";

const inputSchema = z.object({
  input: z.string().describe("CSS color name (e.g., 'coral')"),
});
const outputSchema = z.object({
  output: z.string().describe("Hex color value"),
});

export const colorNameToHex = defineTool({
  meta: {
    id: "color/color-name-to-hex",
    name: "Color Name to Hex",
    description:
      "Free online color name to hex converter — convert CSS color names like 'coral', 'steelblue', or 'tomato' to hex codes instantly in your browser. No data is stored. Supports all 148 CSS named colors.",
    category: "color",
    subgroup: "Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["color", "name", "hex", "css", "convert"],
    examples: [
      {
        title: "Convert Coral",
        description: "Get the hex value for the CSS color 'coral'",
        input: "coral",
        output: "#FF7F50",
      },
      {
        title: "Convert DodgerBlue",
        description: "Get the hex value for 'dodgerblue'",
        input: "dodgerblue",
        output: "#1E90FF",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const name = input.input.trim().toLowerCase();
    const hex = CSS_COLORS[name];
    if (!hex) throw new Error(`Unknown CSS color name: "${input.input}"`);
    return { output: hex };
  },
});
