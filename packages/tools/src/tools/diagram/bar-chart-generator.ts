import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("Bar Chart").describe("Chart title"),
  xAxis: z.string().default("Category").describe("X-axis label"),
  yAxis: z.string().default("Value").describe("Y-axis label"),
  labels: z.array(z.string()).min(1).describe("Category labels"),
  data: z.array(z.number()).min(1).describe("Data values"),
  horizontal: z.boolean().default(false).describe("Horizontal bar chart"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid xychart syntax for bar chart"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (input.labels.length !== input.data.length) {
    throw new Error(
      `Labels count (${input.labels.length}) must match data count (${input.data.length})`
    );
  }

  const lines: string[] = [];
  lines.push(input.horizontal ? "xychart-beta horizontal" : "xychart-beta");
  lines.push(`    title "${input.title}"`);
  lines.push(`    x-axis [${input.labels.map((l) => `"${l}"`).join(", ")}]`);
  lines.push(`    y-axis "${input.yAxis}"`);
  lines.push(`    bar [${input.data.join(", ")}]`);

  return { output: lines.join("\n") };
}

export const barChartGenerator = defineTool({
  meta: {
    id: "diagram/bar-chart-generator",
    name: "Bar Chart Generator",
    description:
      "Free online bar chart generator — create horizontal or vertical bar charts as SVG from labels and values instantly in your browser. No data is stored. Supports custom colors, configurable chart dimensions, and grid lines.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["chart", "bar", "graph", "data", "mermaid"],
    examples: [
      {
        title: "Monthly Sales",
        description: "Generate a bar chart of monthly sales",
        input: {
          title: "Monthly Sales",
          xAxis: "Month",
          yAxis: "Revenue ($K)",
          labels: ["Jan", "Feb", "Mar", "Apr"],
          data: [45, 62, 58, 71],
          horizontal: false,
        },
        output:
          'xychart-beta\n    title "Monthly Sales"\n    x-axis ["Jan", "Feb", "Mar", "Apr"]\n    y-axis "Revenue ($K)"\n    bar [45, 62, 58, 71]',
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
