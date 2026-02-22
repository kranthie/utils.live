import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  width: z.number().min(1).describe("Original width in pixels"),
  height: z.number().min(1).describe("Original height in pixels"),
  targetWidth: z
    .number()
    .min(1)
    .optional()
    .describe("Target width (calculates height)"),
  targetHeight: z
    .number()
    .min(1)
    .optional()
    .describe("Target height (calculates width)"),
});

const outputSchema = z.object({
  output: z.string().describe("Aspect ratio calculation results"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function execute(input: Input): Output {
  const { width, height } = input;
  const ratio = width / height;
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;

  const lines: string[] = [];
  lines.push("Aspect Ratio Calculator");
  lines.push("=======================");
  lines.push("");
  lines.push(`Original dimensions: ${width} x ${height}`);
  lines.push(`Aspect ratio: ${ratioW}:${ratioH}`);
  lines.push(`Decimal ratio: ${ratio.toFixed(4)}`);
  lines.push(`GCD: ${divisor}`);
  lines.push("");

  // Common aspect ratio matching
  const commonRatios: Array<[string, number]> = [
    ["1:1", 1],
    ["4:3", 4 / 3],
    ["3:2", 3 / 2],
    ["16:9", 16 / 9],
    ["16:10", 16 / 10],
    ["21:9", 21 / 9],
    ["2:1", 2],
    ["3:1", 3],
    ["5:4", 5 / 4],
    ["9:16", 9 / 16],
    ["2:3", 2 / 3],
    ["3:4", 3 / 4],
  ];

  let closestRatio = "";
  let closestDiff = Infinity;
  for (const [name, value] of commonRatios) {
    const diff = Math.abs(ratio - value);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestRatio = name;
    }
  }
  lines.push(
    `Closest standard ratio: ${closestRatio} (diff: ${closestDiff.toFixed(4)})`
  );
  lines.push("");

  // Target calculations
  if (input.targetWidth) {
    const newHeight = Math.round(input.targetWidth / ratio);
    lines.push(`At width ${input.targetWidth}px: height = ${newHeight}px`);
  }
  if (input.targetHeight) {
    const newWidth = Math.round(input.targetHeight * ratio);
    lines.push(`At height ${input.targetHeight}px: width = ${newWidth}px`);
  }

  if (!input.targetWidth && !input.targetHeight) {
    // Show common sizes
    lines.push("Common sizes maintaining this ratio:");
    const multipliers = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
    for (const m of multipliers) {
      const w = Math.round(width * m);
      const h = Math.round(height * m);
      lines.push(`  ${w} x ${h} (${m}x)`);
    }
  }

  return { output: lines.join("\n") };
}

export const aspectRatioCalculator = defineTool({
  meta: {
    id: "image/aspect-ratio-calculator",
    name: "Aspect Ratio Calculator",
    description:
      "Free online aspect ratio calculator — calculate display ratios, GCD, and resize dimensions from pixel values instantly in your browser. No data is stored. Matches closest standard ratios like 16:9, 4:3, and 3:2.",
    category: "image",
    subgroup: "Editing",
    tier: ToolTier.CLIENT,
    keywords: ["aspect", "ratio", "calculate", "resize", "dimensions"],
    examples: [
      {
        title: "HD Resolution",
        description: "Calculate aspect ratio for a 1920x1080 display",
        input: { width: 1920, height: 1080 },
        output:
          "Aspect Ratio Calculator\n=======================\n\nOriginal dimensions: 1920 x 1080\nAspect ratio: 16:9\nDecimal ratio: 1.7778\nGCD: 120\n\nClosest standard ratio: 16:9 (diff: 0.0000)\n\nCommon sizes maintaining this ratio:\n  480 x 270 (0.25x)\n  960 x 540 (0.5x)\n  1440 x 810 (0.75x)\n  1920 x 1080 (1x)\n  2880 x 1620 (1.5x)\n  3840 x 2160 (2x)\n  5760 x 3240 (3x)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
