import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Scatter Plot").describe("Chart title"),
  xLabel: z.string().default("X").describe("X-axis label"),
  yLabel: z.string().default("Y").describe("Y-axis label"),
  points: z
    .array(
      z.object({
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        label: z.string().optional().describe("Point label"),
      })
    )
    .min(1)
    .describe("Data points"),
  width: z.number().min(200).max(800).default(500).describe("Chart width"),
  height: z.number().min(200).max(800).default(400).describe("Chart height"),
  color: z.string().default("#4e79a7").describe("Point color"),
  pointSize: z.number().min(2).max(20).default(5).describe("Point radius"),
});

const outputSchema = z.object({
  output: z.string().describe("Scatter plot as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const w = input.width - margin.left - margin.right;
  const h = input.height - margin.top - margin.bottom;

  const xs = input.points.map((p) => p.x);
  const ys = input.points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  function scaleX(v: number): number {
    return margin.left + ((v - xMin) / xRange) * w;
  }
  function scaleY(v: number): number {
    return margin.top + h - ((v - yMin) / yRange) * h;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${input.width} ${input.height}" width="${input.width}" height="${input.height}">`;
  svg += `<style>text { font-family: sans-serif; font-size: 12px; fill: #333; }</style>`;
  svg += `<rect width="${input.width}" height="${input.height}" fill="white"/>`;

  // Title
  svg += `<text x="${input.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold">${escapeXml(input.title)}</text>`;

  // Axes
  svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + h}" stroke="#ccc"/>`;
  svg += `<line x1="${margin.left}" y1="${margin.top + h}" x2="${margin.left + w}" y2="${margin.top + h}" stroke="#ccc"/>`;

  // Grid lines and labels
  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    const xVal = xMin + (xRange * i) / numTicks;
    const yVal = yMin + (yRange * i) / numTicks;
    const px = scaleX(xVal);
    const py = scaleY(yVal);

    svg += `<line x1="${px}" y1="${margin.top + h}" x2="${px}" y2="${margin.top + h + 5}" stroke="#999"/>`;
    svg += `<text x="${px}" y="${margin.top + h + 18}" text-anchor="middle" font-size="10">${xVal.toFixed(1)}</text>`;

    svg += `<line x1="${margin.left - 5}" y1="${py}" x2="${margin.left}" y2="${py}" stroke="#999"/>`;
    svg += `<text x="${margin.left - 8}" y="${py + 4}" text-anchor="end" font-size="10">${yVal.toFixed(1)}</text>`;

    // Grid
    svg += `<line x1="${margin.left}" y1="${py}" x2="${margin.left + w}" y2="${py}" stroke="#eee"/>`;
  }

  // Axis labels
  svg += `<text x="${input.width / 2}" y="${input.height - 5}" text-anchor="middle" font-size="12">${escapeXml(input.xLabel)}</text>`;
  svg += `<text x="15" y="${input.height / 2}" text-anchor="middle" font-size="12" transform="rotate(-90, 15, ${input.height / 2})">${escapeXml(input.yLabel)}</text>`;

  // Points
  for (const point of input.points) {
    const px = scaleX(point.x);
    const py = scaleY(point.y);
    svg += `<circle cx="${px}" cy="${py}" r="${input.pointSize}" fill="${input.color}" opacity="0.7"/>`;
    if (point.label) {
      svg += `<text x="${px + input.pointSize + 3}" y="${py + 4}" font-size="9">${escapeXml(point.label)}</text>`;
    }
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const scatterPlotGenerator = defineTool({
  meta: {
    id: "diagram/scatter-plot-generator",
    name: "Scatter Plot Generator",
    description:
      "Free online scatter plot generator — create scatter plots as SVG from X/Y data points with optional labels instantly in your browser. No data is stored. Supports custom colors, point sizes, and axis labels.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "scatter", "plot", "graph", "svg"],
    examples: [
      {
        title: "Height vs Weight",
        description: "Generate a scatter plot of height vs weight data",
        input: {
          title: "Height vs Weight",
          xLabel: "Height (cm)",
          yLabel: "Weight (kg)",
          points: [
            { x: 160, y: 55 },
            { x: 170, y: 65 },
            { x: 175, y: 70 },
            { x: 180, y: 80 },
            { x: 165, y: 60 },
          ],
          width: 500,
          height: 400,
          color: "#4e79a7",
          pointSize: 5,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="500" height="400"><style>text { font-family: sans-serif; font-size: 12px; fill: #333; }</style><rect width="500" height="400" fill="white"/><text x="250" y="20" text-anchor="middle" font-size="14" font-weight="bold">Height vs Weight</text><line x1="60" y1="40" x2="60" y2="350" stroke="#ccc"/><line x1="60" y1="350" x2="480" y2="350" stroke="#ccc"/><line x1="60" y1="350" x2="60" y2="355" stroke="#999"/><text x="60" y="368" text-anchor="middle" font-size="10">160.0</text><line x1="55" y1="350" x2="60" y2="350" stroke="#999"/><text x="52" y="354" text-anchor="end" font-size="10">55.0</text><line x1="60" y1="350" x2="480" y2="350" stroke="#eee"/><line x1="144" y1="350" x2="144" y2="355" stroke="#999"/><text x="144" y="368" text-anchor="middle" font-size="10">164.0</text><line x1="55" y1="288" x2="60" y2="288" stroke="#999"/><text x="52" y="292" text-anchor="end" font-size="10">60.0</text><line x1="60" y1="288" x2="480" y2="288" stroke="#eee"/><line x1="228" y1="350" x2="228" y2="355" stroke="#999"/><text x="228" y="368" text-anchor="middle" font-size="10">168.0</text><line x1="55" y1="226" x2="60" y2="226" stroke="#999"/><text x="52" y="230" text-anchor="end" font-size="10">65.0</text><line x1="60" y1="226" x2="480" y2="226" stroke="#eee"/><line x1="312" y1="350" x2="312" y2="355" stroke="#999"/><text x="312" y="368" text-anchor="middle" font-size="10">172.0</text><line x1="55" y1="164" x2="60" y2="164" stroke="#999"/><text x="52" y="168" text-anchor="end" font-size="10">70.0</text><line x1="60" y1="164" x2="480" y2="164" stroke="#eee"/><line x1="396" y1="350" x2="396" y2="355" stroke="#999"/><text x="396" y="368" text-anchor="middle" font-size="10">176.0</text><line x1="55" y1="102" x2="60" y2="102" stroke="#999"/><text x="52" y="106" text-anchor="end" font-size="10">75.0</text><line x1="60" y1="102" x2="480" y2="102" stroke="#eee"/><line x1="480" y1="350" x2="480" y2="355" stroke="#999"/><text x="480" y="368" text-anchor="middle" font-size="10">180.0</text><line x1="55" y1="40" x2="60" y2="40" stroke="#999"/><text x="52" y="44" text-anchor="end" font-size="10">80.0</text><line x1="60" y1="40" x2="480" y2="40" stroke="#eee"/><text x="250" y="395" text-anchor="middle" font-size="12">Height (cm)</text><text x="15" y="200" text-anchor="middle" font-size="12" transform="rotate(-90, 15, 200)">Weight (kg)</text><circle cx="60" cy="350" r="5" fill="#4e79a7" opacity="0.7"/><circle cx="270" cy="226" r="5" fill="#4e79a7" opacity="0.7"/><circle cx="375" cy="164" r="5" fill="#4e79a7" opacity="0.7"/><circle cx="480" cy="40" r="5" fill="#4e79a7" opacity="0.7"/><circle cx="165" cy="288" r="5" fill="#4e79a7" opacity="0.7"/></svg>',
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
