import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Radar Chart").describe("Chart title"),
  axes: z.array(z.string()).min(3).describe("Axis labels"),
  series: z
    .array(
      z.object({
        name: z.string().describe("Series name"),
        values: z
          .array(z.number().min(0).max(100))
          .describe("Values (0-100) for each axis"),
        color: z.string().optional().describe("Series color"),
      })
    )
    .min(1)
    .describe("Data series"),
  size: z.number().min(200).max(800).default(400).describe("Chart size"),
  showGrid: z.boolean().default(true).describe("Show grid lines"),
});

const outputSchema = z.object({
  output: z.string().describe("Radar chart as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const DEFAULT_COLORS = ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2"];

function execute(input: Input): Output {
  const cx = input.size / 2;
  const cy = input.size / 2;
  const radius = input.size / 2 - 50;
  const numAxes = input.axes.length;
  const angleStep = (2 * Math.PI) / numAxes;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${input.size} ${input.size}" width="${input.size}" height="${input.size}">`;
  svg += `<style>text { font-family: sans-serif; font-size: 11px; fill: #333; }</style>`;
  svg += `<rect width="${input.size}" height="${input.size}" fill="white"/>`;

  // Title
  svg += `<text x="${cx}" y="18" text-anchor="middle" font-size="14" font-weight="bold">${escapeXml(input.title)}</text>`;

  // Grid
  if (input.showGrid) {
    for (let level = 1; level <= 5; level++) {
      const r = (radius * level) / 5;
      let path = "";
      for (let i = 0; i < numAxes; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      path += " Z";
      svg += `<path d="${path}" fill="none" stroke="#ddd" stroke-width="1"/>`;
    }
  }

  // Axes lines and labels
  for (let i = 0; i < numAxes; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#ccc"/>`;

    const lx = cx + (radius + 20) * Math.cos(angle);
    const ly = cy + (radius + 20) * Math.sin(angle);
    const anchor =
      Math.abs(Math.cos(angle)) < 0.1
        ? "middle"
        : Math.cos(angle) > 0
          ? "start"
          : "end";
    svg += `<text x="${lx}" y="${ly + 4}" text-anchor="${anchor}" font-size="11">${escapeXml(input.axes[i]!)}</text>`;
  }

  // Data series
  for (let s = 0; s < input.series.length; s++) {
    const series = input.series[s]!;
    const color =
      series.color ?? DEFAULT_COLORS[s % DEFAULT_COLORS.length] ?? "#4e79a7";

    if (series.values.length !== numAxes) {
      throw new Error(
        `Series "${series.name}" has ${series.values.length} values but ${numAxes} axes`
      );
    }

    let path = "";
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (radius * series.values[i]!) / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    path += " Z";

    svg += `<path d="${path}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>`;

    // Points
    for (let i = 0; i < numAxes; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (radius * series.values[i]!) / 100;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;
    }
  }

  // Legend
  let legendX = 10;
  const legendY = input.size - 15;
  for (let s = 0; s < input.series.length; s++) {
    const legendSeries = input.series[s]!;
    const legendColor =
      legendSeries.color ??
      DEFAULT_COLORS[s % DEFAULT_COLORS.length] ??
      "#4e79a7";
    svg += `<rect x="${legendX}" y="${legendY - 8}" width="10" height="10" fill="${legendColor}"/>`;
    svg += `<text x="${legendX + 14}" y="${legendY}" font-size="10">${escapeXml(legendSeries.name)}</text>`;
    legendX += 14 + legendSeries.name.length * 6 + 10;
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const radarChartGenerator = defineTool({
  meta: {
    id: "diagram/radar-chart-generator",
    name: "Radar Chart Generator",
    description:
      "Free online radar chart generator — create radar/spider charts as SVG from multi-axis data series instantly in your browser. No data is stored. Supports multiple series, customizable axis labels, and concentric grid rings.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "radar", "spider", "graph", "svg"],
    examples: [
      {
        title: "Skill Assessment",
        description: "Generate a radar chart comparing skill levels",
        input: {
          title: "Developer Skills",
          axes: ["JavaScript", "CSS", "React", "Node.js", "SQL"],
          series: [
            { name: "Alice", values: [90, 75, 85, 70, 60] },
            { name: "Bob", values: [70, 80, 60, 90, 85] },
          ],
          size: 400,
          showGrid: true,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400"><style>text { font-family: sans-serif; font-size: 11px; fill: #333; }</style><rect width="400" height="400" fill="white"/><text x="200" y="18" text-anchor="middle" font-size="14" font-weight="bold">Developer Skills</text><path d="M 200 170 L 228.5316954888546 190.72949016875157 L 217.6335575687742 224.27050983124843 L 182.3664424312258 224.27050983124843 L 171.4683045111454 190.72949016875157 Z" fill="none" stroke="#ddd" stroke-width="1"/><path d="M 200 140 L 257.0633909777092 181.45898033750316 L 235.2671151375484 248.54101966249686 L 164.7328848624516 248.54101966249686 L 142.93660902229078 181.45898033750316 Z" fill="none" stroke="#ddd" stroke-width="1"/><path d="M 200 110 L 285.5950864665638 172.18847050625473 L 252.90067270632258 272.8115294937453 L 147.09932729367742 272.8115294937453 L 114.40491353343617 172.18847050625476 Z" fill="none" stroke="#ddd" stroke-width="1"/><path d="M 200 80 L 314.12678195541844 162.91796067500633 L 270.5342302750968 297.08203932499373 L 129.46576972490323 297.08203932499373 L 85.87321804458156 162.91796067500633 Z" fill="none" stroke="#ddd" stroke-width="1"/><path d="M 200 50 L 342.658477444273 153.6474508437579 L 288.167787843871 321.3525491562421 L 111.83221215612905 321.3525491562421 L 57.341522555726954 153.6474508437579 Z" fill="none" stroke="#ddd" stroke-width="1"/><line x1="200" y1="200" x2="200" y2="50" stroke="#ccc"/><text x="200" y="34" text-anchor="middle" font-size="11">JavaScript</text><line x1="200" y1="200" x2="342.658477444273" y2="153.6474508437579" stroke="#ccc"/><text x="361.67960777017606" y="151.46711095625895" text-anchor="start" font-size="11">CSS</text><line x1="200" y1="200" x2="288.167787843871" y2="321.3525491562421" stroke="#ccc"/><text x="299.9234928897204" y="341.5328890437411" text-anchor="start" font-size="11">React</text><line x1="200" y1="200" x2="111.83221215612905" y2="321.3525491562421" stroke="#ccc"/><text x="100.07650711027958" y="341.5328890437411" text-anchor="end" font-size="11">Node.js</text><line x1="200" y1="200" x2="57.341522555726954" y2="153.6474508437579" stroke="#ccc"/><text x="38.32039222982388" y="151.46711095625898" text-anchor="end" font-size="11">SQL</text><path d="M 200 65 L 306.99385808320477 165.2355881328184 L 274.94261966729033 303.1496667828058 L 138.28254850929034 284.94678440936946 L 114.40491353343617 172.18847050625476 Z" fill="#4e79a7" fill-opacity="0.2" stroke="#4e79a7" stroke-width="2"/><circle cx="200" cy="65" r="3" fill="#4e79a7"/><circle cx="306.99385808320477" cy="165.2355881328184" r="3" fill="#4e79a7"/><circle cx="274.94261966729033" cy="303.1496667828058" r="3" fill="#4e79a7"/><circle cx="138.28254850929034" cy="284.94678440936946" r="3" fill="#4e79a7"/><circle cx="114.40491353343617" cy="172.18847050625476" r="3" fill="#4e79a7"/><path d="M 200 95 L 314.12678195541844 162.91796067500633 L 252.90067270632258 272.8115294937453 L 120.64899094051614 309.2172942406179 L 78.74029417236791 160.60033321719422 Z" fill="#f28e2b" fill-opacity="0.2" stroke="#f28e2b" stroke-width="2"/><circle cx="200" cy="95" r="3" fill="#f28e2b"/><circle cx="314.12678195541844" cy="162.91796067500633" r="3" fill="#f28e2b"/><circle cx="252.90067270632258" cy="272.8115294937453" r="3" fill="#f28e2b"/><circle cx="120.64899094051614" cy="309.2172942406179" r="3" fill="#f28e2b"/><circle cx="78.74029417236791" cy="160.60033321719422" r="3" fill="#f28e2b"/><rect x="10" y="377" width="10" height="10" fill="#4e79a7"/><text x="24" y="385" font-size="10">Alice</text><rect x="64" y="377" width="10" height="10" fill="#f28e2b"/><text x="78" y="385" font-size="10">Bob</text></svg>',
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
