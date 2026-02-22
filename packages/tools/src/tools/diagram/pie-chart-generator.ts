import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Pie Chart").describe("Chart title"),
  segments: z
    .array(
      z.object({
        label: z.string().describe("Segment label"),
        value: z.number().min(0).describe("Segment value"),
        color: z.string().optional().describe("Segment color (hex)"),
      })
    )
    .min(1)
    .describe("Pie chart segments"),
  width: z.number().min(100).max(800).default(400).describe("Chart width"),
  height: z.number().min(100).max(800).default(400).describe("Chart height"),
  donut: z.boolean().default(false).describe("Render as donut chart"),
});

const outputSchema = z.object({
  output: z.string().describe("Pie chart as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const DEFAULT_COLORS = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

function execute(input: Input): Output {
  const total = input.segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    throw new Error("Total value cannot be zero");
  }

  const cx = input.width / 2;
  const cy = input.height / 2;
  const radius = Math.min(cx, cy) - 40;
  const innerRadius = input.donut ? radius * 0.5 : 0;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${input.width} ${input.height}" width="${input.width}" height="${input.height}">`;
  svg += `<style>text { font-family: sans-serif; font-size: 12px; }</style>`;

  // Title
  svg += `<text x="${cx}" y="20" text-anchor="middle" font-size="16" font-weight="bold">${escapeXml(input.title)}</text>`;

  let startAngle = -Math.PI / 2;

  for (let i = 0; i < input.segments.length; i++) {
    const segment = input.segments[i]!;
    const percentage = segment.value / total;
    const angle = percentage * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const color =
      segment.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] ?? "#4e79a7";

    // SVG arc path
    const largeArc = angle > Math.PI ? 1 : 0;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    let path: string;
    if (input.donut) {
      const ix1 = cx + innerRadius * Math.cos(startAngle);
      const iy1 = cy + innerRadius * Math.sin(startAngle);
      const ix2 = cx + innerRadius * Math.cos(endAngle);
      const iy2 = cy + innerRadius * Math.sin(endAngle);
      path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    } else {
      if (input.segments.length === 1) {
        // Full circle
        path = `M ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} Z`;
      } else {
        path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }
    }

    svg += `<path d="${path}" fill="${color}" stroke="white" stroke-width="2"/>`;

    // Label
    const labelAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const lx = cx + labelRadius * Math.cos(labelAngle);
    const ly = cy + labelRadius * Math.sin(labelAngle);

    if (percentage > 0.05) {
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-weight="bold">${(percentage * 100).toFixed(1)}%</text>`;
    }

    startAngle = endAngle;
  }

  // Legend
  const legendY = input.height - 15;
  let legendX = 10;
  for (let i = 0; i < input.segments.length; i++) {
    const seg = input.segments[i]!;
    const legendColor =
      seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] ?? "#4e79a7";
    svg += `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${legendColor}"/>`;
    svg += `<text x="${legendX + 14}" y="${legendY}" font-size="10">${escapeXml(seg.label)}</text>`;
    legendX += 14 + seg.label.length * 6 + 10;
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

export const pieChartGenerator = defineTool({
  meta: {
    id: "diagram/pie-chart-generator",
    name: "Pie Chart Generator",
    description:
      "Free online pie chart generator — create pie and donut charts as SVG from labeled data segments instantly in your browser. No data is stored. Supports custom colors, percentage labels, and a legend row.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "pie", "donut", "graph", "svg"],
    examples: [
      {
        title: "Browser Market Share",
        description: "Generate a pie chart of browser usage",
        input: {
          title: "Browser Market Share",
          segments: [
            { label: "Chrome", value: 65 },
            { label: "Safari", value: 19 },
            { label: "Firefox", value: 8 },
            { label: "Edge", value: 5 },
            { label: "Other", value: 3 },
          ],
          width: 400,
          height: 400,
          donut: false,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><style>text { font-family: sans-serif; font-size: 12px; }</style><text x="200" y="20" text-anchor="middle" font-size="16" font-weight="bold">Browser Market Share</text><path d="M 200 200 L 200 40 A 160 160 0 1 1 70.55728090000844 294.04564036679574 Z" fill="#4e79a7" stroke="white" stroke-width="2"/><text x="299.7927307090972" y="250.84693597082924" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-weight="bold">65.0%</text><path d="M 200 200 L 70.55728090000844 294.04564036679574 A 160 160 0 0 1 64.90753191967758 114.26771280336057 Z" fill="#f28e2b" stroke="white" stroke-width="2"/><text x="88.05526523903806" y="203.51800501675035" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-weight="bold">19.0%</text><path d="M 200 200 L 64.90753191967758 114.26771280336057 A 160 160 0 0 1 122.91941214372555 59.790931192981816 Z" fill="#e15759" stroke="white" stroke-width="2"/><text x="123.33072413598684" y="118.35551372880192" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-weight="bold">8.0%</text><path d="M 200 200 L 122.91941214372555 59.790931192981816 A 160 160 0 0 1 170.01898966628406 42.834039883409815 Z" fill="#76b7b2" stroke="white" stroke-width="2"/><path d="M 200 200 L 170.01898966628406 42.834039883409815 A 160 160 0 0 1 199.99999999999997 40 Z" fill="#59a14f" stroke="white" stroke-width="2"/><rect x="10" y="377" width="10" height="10" fill="#4e79a7"/><text x="24" y="385" font-size="10">Chrome</text><rect x="70" y="377" width="10" height="10" fill="#f28e2b"/><text x="84" y="385" font-size="10">Safari</text><rect x="130" y="377" width="10" height="10" fill="#e15759"/><text x="144" y="385" font-size="10">Firefox</text><rect x="196" y="377" width="10" height="10" fill="#76b7b2"/><text x="210" y="385" font-size="10">Edge</text><rect x="244" y="377" width="10" height="10" fill="#59a14f"/><text x="258" y="385" font-size="10">Other</text></svg>',
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
