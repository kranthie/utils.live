import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Area Chart").describe("Chart title"),
  xAxis: z.string().default("X").describe("X-axis label"),
  yAxis: z.string().default("Y").describe("Y-axis label"),
  series: z
    .array(
      z.object({
        name: z.string().describe("Series name"),
        data: z.array(z.number()).min(2).describe("Data points"),
        color: z.string().optional().describe("Series color"),
      })
    )
    .min(1)
    .describe("Data series"),
  labels: z.array(z.string()).optional().describe("X-axis labels"),
  stacked: z.boolean().default(false).describe("Stack the areas"),
  width: z.number().min(200).max(800).default(500).describe("Chart width"),
  height: z.number().min(200).max(600).default(350).describe("Chart height"),
});

const outputSchema = z.object({
  output: z.string().describe("Area chart as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const DEFAULT_COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f"];

function execute(input: Input): Output {
  const margin = { top: 40, right: 20, bottom: 50, left: 60 };
  const w = input.width - margin.left - margin.right;
  const h = input.height - margin.top - margin.bottom;

  // Find data range
  let maxVal = 0;
  const firstSeries = input.series[0];
  if (!firstSeries) throw new Error("At least one series is required");
  const dataLen = firstSeries.data.length;
  if (input.stacked) {
    for (let i = 0; i < dataLen; i++) {
      let stackSum = 0;
      for (const series of input.series) {
        stackSum += series.data[i] || 0;
      }
      maxVal = Math.max(maxVal, stackSum);
    }
  } else {
    for (const series of input.series) {
      maxVal = Math.max(maxVal, ...series.data);
    }
  }
  maxVal = maxVal || 1;

  function scaleX(i: number): number {
    return margin.left + (i / (dataLen - 1)) * w;
  }
  function scaleY(v: number): number {
    return margin.top + h - (v / maxVal) * h;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${input.width} ${input.height}" width="${input.width}" height="${input.height}">`;
  svg += `<style>text { font-family: sans-serif; font-size: 11px; fill: #333; }</style>`;
  svg += `<rect width="${input.width}" height="${input.height}" fill="white"/>`;

  // Title
  svg += `<text x="${input.width / 2}" y="20" text-anchor="middle" font-size="14" font-weight="bold">${escapeXml(input.title)}</text>`;

  // Axes
  svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + h}" stroke="#ccc"/>`;
  svg += `<line x1="${margin.left}" y1="${margin.top + h}" x2="${margin.left + w}" y2="${margin.top + h}" stroke="#ccc"/>`;

  // Draw areas (bottom to top)
  const baseY: number[] = new Array<number>(dataLen).fill(0);

  const dataAt = (data: number[], i: number): number => Number(data[i] ?? 0);
  const baseAt = (i: number): number => Number(baseY[i] ?? 0);

  for (let s = input.series.length - 1; s >= 0; s--) {
    const series = input.series[s]!;
    const color =
      series.color ?? DEFAULT_COLORS[s % DEFAULT_COLORS.length] ?? "#4e79a7";

    let path = `M ${scaleX(0)} ${scaleY(baseAt(0) + dataAt(series.data, 0))}`;
    for (let i = 1; i < dataLen; i++) {
      const val = input.stacked
        ? baseAt(i) + dataAt(series.data, i)
        : dataAt(series.data, i);
      path += ` L ${scaleX(i)} ${scaleY(val)}`;
    }

    // Close the path back along the bottom
    if (input.stacked) {
      for (let i = dataLen - 1; i >= 0; i--) {
        path += ` L ${scaleX(i)} ${scaleY(baseAt(i))}`;
      }
    } else {
      path += ` L ${scaleX(dataLen - 1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)}`;
    }
    path += " Z";

    svg += `<path d="${path}" fill="${color}" opacity="0.6"/>`;

    // Line on top
    let linePath = `M ${scaleX(0)} ${scaleY((input.stacked ? baseAt(0) : 0) + dataAt(series.data, 0))}`;
    for (let i = 1; i < dataLen; i++) {
      const val = input.stacked
        ? baseAt(i) + dataAt(series.data, i)
        : dataAt(series.data, i);
      linePath += ` L ${scaleX(i)} ${scaleY(val)}`;
    }
    svg += `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2"/>`;

    if (input.stacked) {
      for (let i = 0; i < dataLen; i++) {
        baseY[i] = baseAt(i) + dataAt(series.data, i);
      }
    }
  }

  // X-axis labels
  if (input.labels) {
    for (let i = 0; i < Math.min(input.labels.length, dataLen); i++) {
      svg += `<text x="${scaleX(i)}" y="${margin.top + h + 18}" text-anchor="middle" font-size="10">${escapeXml(input.labels[i] ?? "")}</text>`;
    }
  }

  // Legend
  let legendX = margin.left;
  for (let s = 0; s < input.series.length; s++) {
    const ser = input.series[s]!;
    const color =
      ser.color ?? DEFAULT_COLORS[s % DEFAULT_COLORS.length] ?? "#4e79a7";
    svg += `<rect x="${legendX}" y="${input.height - 15}" width="10" height="10" fill="${color}"/>`;
    svg += `<text x="${legendX + 14}" y="${input.height - 6}" font-size="10">${escapeXml(ser.name)}</text>`;
    legendX += 14 + ser.name.length * 6 + 10;
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const areaChartGenerator = defineTool({
  meta: {
    id: "diagram/area-chart-generator",
    name: "Area Chart Generator",
    description:
      "Free online area chart generator — create smooth area charts as SVG from data series with customizable colors, labels, and stacking instantly in your browser. No data is stored. Supports multiple series, stacked areas, and X-axis labels.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "area", "graph", "svg", "stacked"],
    examples: [
      {
        title: "Revenue Trends",
        description: "Generate an area chart of revenue trends",
        input: {
          title: "Quarterly Revenue",
          xAxis: "Quarter",
          yAxis: "Revenue",
          series: [
            { name: "Product A", data: [30, 45, 55, 70] },
            { name: "Product B", data: [20, 35, 40, 50] },
          ],
          labels: ["Q1", "Q2", "Q3", "Q4"],
          stacked: false,
          width: 500,
          height: 350,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 350" width="500" height="350"><style>text { font-family: sans-serif; font-size: 11px; fill: #333; }</style><rect width="500" height="350" fill="white"/><text x="250" y="20" text-anchor="middle" font-size="14" font-weight="bold">Quarterly Revenue</text><line x1="60" y1="40" x2="60" y2="300" stroke="#ccc"/><line x1="60" y1="300" x2="480" y2="300" stroke="#ccc"/><path d="M 60 225.71428571428572 L 200 170 L 340 151.42857142857144 L 480 114.28571428571428 L 480 300 L 60 300 Z" fill="#f28e2b" opacity="0.6"/><path d="M 60 225.71428571428572 L 200 170 L 340 151.42857142857144 L 480 114.28571428571428" fill="none" stroke="#f28e2b" stroke-width="2"/><path d="M 60 188.57142857142858 L 200 132.85714285714283 L 340 95.71428571428572 L 480 40 L 480 300 L 60 300 Z" fill="#4e79a7" opacity="0.6"/><path d="M 60 188.57142857142858 L 200 132.85714285714283 L 340 95.71428571428572 L 480 40" fill="none" stroke="#4e79a7" stroke-width="2"/><text x="60" y="318" text-anchor="middle" font-size="10">Q1</text><text x="200" y="318" text-anchor="middle" font-size="10">Q2</text><text x="340" y="318" text-anchor="middle" font-size="10">Q3</text><text x="480" y="318" text-anchor="middle" font-size="10">Q4</text><rect x="60" y="335" width="10" height="10" fill="#4e79a7"/><text x="74" y="344" font-size="10">Product A</text><rect x="138" y="335" width="10" height="10" fill="#f28e2b"/><text x="152" y="344" font-size="10">Product B</text></svg>',
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
