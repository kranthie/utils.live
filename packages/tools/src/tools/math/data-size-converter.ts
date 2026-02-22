import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const units = [
  "B",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "KiB",
  "MiB",
  "GiB",
  "TiB",
] as const;

const toBytes: Record<string, number> = {
  B: 1,
  KB: 1000,
  MB: 1e6,
  GB: 1e9,
  TB: 1e12,
  PB: 1e15,
  KiB: 1024,
  MiB: 1048576,
  GiB: 1073741824,
  TiB: 1099511627776,
};

const inputSchema = z.object({
  input: z.string().describe("Value to convert (e.g., '100')"),
});

const optionsSchema = z.object({
  from: z.enum(units).default("MB").describe("Source unit"),
  to: z.enum(units).default("GB").describe("Target unit"),
});

const outputSchema = z.object({
  output: z.string().describe("Converted value"),
});

export const dataSizeConverter = defineTool({
  meta: {
    id: "math/data-size-converter",
    name: "Data Size Converter",
    description:
      "Free online Data Size Converter — convert between data size units instantly in your browser. No data is stored. Supports bytes, KB, MB, GB, TB, PB, and binary units (KiB, MiB, GiB, TiB).",
    category: "math",
    subgroup: "Unit Converters",
    tier: ToolTier.CLIENT,
    keywords: ["data", "size", "bytes", "kilobytes", "megabytes", "gigabytes"],
    examples: [
      {
        title: "Megabytes to Gigabytes",
        description: "Convert 500 megabytes to gigabytes",
        input: "500",
        output: "0.5",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute: (input, options) => {
    const value = parseFloat(input.input.trim());
    if (isNaN(value)) throw new Error("Invalid number");
    const from = options?.from ?? "MB";
    const to = options?.to ?? "GB";
    const fromFactor = toBytes[from];
    const toFactor = toBytes[to];
    if (fromFactor === undefined || toFactor === undefined)
      throw new Error("Unknown unit");
    const bytes = value * fromFactor;
    const result = bytes / toFactor;
    return { output: `${result}` };
  },
});
