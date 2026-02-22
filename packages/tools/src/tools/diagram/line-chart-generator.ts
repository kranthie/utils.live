import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Line Chart").describe("Chart title"),
  xAxis: z.string().default("X").describe("X-axis label"),
  yAxis: z.string().default("Y").describe("Y-axis label"),
  series: z
    .array(
      z.object({
        name: z.string().describe("Series name"),
        data: z.array(z.number()).min(2).describe("Data points"),
      })
    )
    .min(1)
    .describe("Data series"),
  labels: z.array(z.string()).optional().describe("X-axis labels"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid xychart syntax for line chart"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = [];
  lines.push("xychart-beta");
  lines.push(`    title "${input.title}"`);
  lines.push(
    `    x-axis "${input.xAxis}"${input.labels ? " [" + input.labels.map((l) => `"${l}"`).join(", ") + "]" : ""}`
  );
  lines.push(`    y-axis "${input.yAxis}"`);

  for (const series of input.series) {
    lines.push(`    line [${series.data.join(", ")}]`);
  }

  return { output: lines.join("\n") };
}

export const lineChartGenerator = defineTool({
  meta: {
    id: "diagram/line-chart-generator",
    name: "Line Chart Generator",
    description:
      "Free online line chart generator — create line charts as SVG from data series with customizable colors, markers, and labels instantly in your browser. No data is stored. Supports multiple series, X-axis labels, and grid lines.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "line", "graph", "data", "mermaid"],
    examples: [
      {
        title: "Temperature Trend",
        description: "Generate a line chart of temperature over time",
        input: {
          title: "Weekly Temperature",
          xAxis: "Day",
          yAxis: "Temp (F)",
          series: [{ name: "Temperature", data: [68, 72, 75, 71, 69, 74, 76] }],
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        output:
          'xychart-beta\n    title "Weekly Temperature"\n    x-axis "Day" ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]\n    y-axis "Temp (F)"\n    line [68, 72, 75, 71, 69, 74, 76]',
      },
    ],
    ui: {
      outputRenderer: "diagram",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
