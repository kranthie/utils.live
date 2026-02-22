import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  data: z.array(z.number()).min(2).describe("Data points for the sparkline"),
  width: z.number().min(50).max(500).default(150).describe("Sparkline width"),
  height: z.number().min(15).max(100).default(30).describe("Sparkline height"),
  color: z.string().default("#4e79a7").describe("Line color"),
  fillColor: z.string().optional().describe("Fill color under the line"),
  strokeWidth: z
    .number()
    .min(0.5)
    .max(5)
    .default(1.5)
    .describe("Line stroke width"),
  showDots: z.boolean().default(false).describe("Show dots at data points"),
  showMinMax: z
    .boolean()
    .default(false)
    .describe("Highlight min and max points"),
});

const outputSchema = z.object({
  output: z.string().describe("Sparkline as SVG string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const padding = 2;
  const w = input.width - padding * 2;
  const h = input.height - padding * 2;

  const minVal = Math.min(...input.data);
  const maxVal = Math.max(...input.data);
  const range = maxVal - minVal || 1;

  function scaleX(i: number): number {
    return padding + (i / (input.data.length - 1)) * w;
  }
  function scaleY(v: number): number {
    return padding + h - ((v - minVal) / range) * h;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${input.width} ${input.height}" width="${input.width}" height="${input.height}">`;

  // Fill area
  if (input.fillColor) {
    let fillPath = `M ${scaleX(0)} ${scaleY(input.data[0] ?? 0)}`;
    for (let i = 1; i < input.data.length; i++) {
      fillPath += ` L ${scaleX(i)} ${scaleY(input.data[i] ?? 0)}`;
    }
    fillPath += ` L ${scaleX(input.data.length - 1)} ${padding + h} L ${scaleX(0)} ${padding + h} Z`;
    svg += `<path d="${fillPath}" fill="${input.fillColor}" opacity="0.3"/>`;
  }

  // Line
  let linePath = `M ${scaleX(0)} ${scaleY(input.data[0] ?? 0)}`;
  for (let i = 1; i < input.data.length; i++) {
    linePath += ` L ${scaleX(i)} ${scaleY(input.data[i] ?? 0)}`;
  }
  svg += `<path d="${linePath}" fill="none" stroke="${input.color}" stroke-width="${input.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // Dots
  if (input.showDots) {
    for (let i = 0; i < input.data.length; i++) {
      svg += `<circle cx="${scaleX(i)}" cy="${scaleY(input.data[i] ?? 0)}" r="1.5" fill="${input.color}"/>`;
    }
  }

  // Min/Max markers
  if (input.showMinMax) {
    const minIdx = input.data.indexOf(minVal);
    const maxIdx = input.data.indexOf(maxVal);
    svg += `<circle cx="${scaleX(minIdx)}" cy="${scaleY(minVal)}" r="2.5" fill="#e15759"/>`;
    svg += `<circle cx="${scaleX(maxIdx)}" cy="${scaleY(maxVal)}" r="2.5" fill="#59a14f"/>`;
  }

  svg += "</svg>";
  return { output: svg };
}

export const sparklineGenerator = defineTool({
  meta: {
    id: "diagram/sparkline-generator",
    name: "Sparkline Generator",
    description:
      "Free online sparkline generator — create compact inline sparkline charts as SVG from numeric data instantly in your browser. No data is stored. Supports fill color, dot markers, and min/max highlighting.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["sparkline", "chart", "inline", "mini", "svg"],
    examples: [
      {
        title: "Stock Sparkline",
        description: "Generate a mini sparkline for stock price trend",
        input: {
          data: [10, 15, 13, 17, 20, 18, 22, 25],
          width: 150,
          height: 30,
          color: "#4e79a7",
          strokeWidth: 1.5,
          showDots: false,
          showMinMax: true,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 30" width="150" height="30"><path d="M 2 28 L 22.857142857142858 19.333333333333336 L 43.714285714285715 22.8 L 64.57142857142857 15.866666666666667 L 85.42857142857143 10.666666666666668 L 106.28571428571429 14.133333333333333 L 127.14285714285714 7.199999999999999 L 148 2" fill="none" stroke="#4e79a7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="2" cy="28" r="2.5" fill="#e15759"/><circle cx="148" cy="2" r="2.5" fill="#59a14f"/></svg>',
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
