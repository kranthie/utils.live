import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = ["deg", "rad", "grad", "turn", "arcmin", "arcsec"] as const;

const toDegrees: Record<string, number> = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 0.9,
  turn: 360,
  arcmin: 1 / 60,
  arcsec: 1 / 3600,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '180')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("deg").describe("Source unit"),
  to: z.enum(units).default("rad").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const angleConverter = defineTool({
  meta: {
    id: "math/angle-converter",
    name: "Angle Converter",
    description:
      "Free online Angle Converter — convert between angle units instantly in your browser. No data is stored. Supports degrees, radians, gradians, turns, arcminutes, and arcseconds.",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["angle", "convert", "degrees", "radians", "gradians", "turns"],
    examples: [
      {
        title: "Degrees to Radians",
        description: "Convert 180 degrees to radians",
        input: "180",
        output: "3.141592653589793",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "deg";
    const to = options?.to ?? "rad";
    const fromFactor = toDegrees[from];
    const toFactor = toDegrees[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const degrees = value * fromFactor;
    const result = degrees / toFactor;
    return { output: `${result}` };
  },
});
