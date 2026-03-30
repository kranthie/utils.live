import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON data to convert to chart"),
});

const optionsSchema = z.object({
  chartType: z
    .enum(["bar", "line", "pie"])
    .default("bar")
    .describe("Chart type to generate"),
  xField: z.string().optional().describe("Field name for X-axis values"),
  yField: z.string().optional().describe("Field name for Y-axis values"),
  labelField: z
    .string()
    .optional()
    .describe("Field name for labels (pie chart)"),
  valueField: z
    .string()
    .optional()
    .describe("Field name for values (pie chart)"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid chart syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  let data: unknown;
  try {
    data = JSON.parse(input.input);
  } catch {
    throw new Error("Invalid JSON input");
  }

  const chartType = options?.chartType ?? "bar";

  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error("JSON array is empty");
    }

    // Array of objects
    if (typeof data[0] === "object" && data[0] !== null) {
      const keys = Object.keys(data[0] as Record<string, unknown>);
      const labelField = options?.labelField || options?.xField || keys[0];
      const valueField =
        options?.valueField || options?.yField || keys[1] || keys[0];

      const labels = data.map((item: Record<string, unknown>) => {
        const val = item[labelField!];
        return val == null
          ? ""
          : typeof val === "object"
            ? JSON.stringify(val)
            : String(val as string | number | boolean);
      });
      const values = data.map((item: Record<string, unknown>) =>
        Number(item[valueField!] ?? 0)
      );

      if (chartType === "pie") {
        const lines = [`pie title Data Distribution`];
        for (let i = 0; i < labels.length; i++) {
          lines.push(`    "${labels[i]}" : ${values[i]}`);
        }
        return { output: lines.join("\n") };
      }

      const lines = ["xychart-beta"];
      lines.push(`    title "JSON Data Chart"`);
      lines.push(`    x-axis [${labels.map((l) => `"${l}"`).join(", ")}]`);
      lines.push(`    y-axis "${valueField}"`);

      if (chartType === "line") {
        lines.push(`    line [${values.join(", ")}]`);
      } else {
        lines.push(`    bar [${values.join(", ")}]`);
      }

      return { output: lines.join("\n") };
    }

    // Array of numbers
    if (typeof data[0] === "number") {
      const values = data as number[];
      const labels = values.map((_, i) => `"${i + 1}"`);

      if (chartType === "pie") {
        const lines = [`pie title Data Distribution`];
        for (let i = 0; i < values.length; i++) {
          lines.push(`    "Item ${i + 1}" : ${values[i]}`);
        }
        return { output: lines.join("\n") };
      }

      const lines = ["xychart-beta"];
      lines.push(`    title "JSON Data Chart"`);
      lines.push(`    x-axis [${labels.join(", ")}]`);
      lines.push(`    y-axis "Value"`);
      lines.push(
        `    ${chartType === "line" ? "line" : "bar"} [${values.join(", ")}]`
      );

      return { output: lines.join("\n") };
    }
  }

  // Object with key-value pairs
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const entries = Object.entries(obj).filter(
      ([, v]) => typeof v === "number"
    );

    if (entries.length === 0) {
      throw new Error("No numeric values found in JSON object");
    }

    if (chartType === "pie") {
      const lines = [`pie title Data Distribution`];
      for (const [key, value] of entries) {
        lines.push(`    "${key}" : ${String(value)}`);
      }
      return { output: lines.join("\n") };
    }

    const lines = ["xychart-beta"];
    lines.push(`    title "JSON Data Chart"`);
    lines.push(`    x-axis [${entries.map(([k]) => `"${k}"`).join(", ")}]`);
    lines.push(`    y-axis "Value"`);
    lines.push(
      `    ${chartType === "line" ? "line" : "bar"} [${entries.map(([, v]) => v).join(", ")}]`
    );

    return { output: lines.join("\n") };
  }

  throw new Error(
    "Unsupported JSON structure. Provide an array of objects/numbers or an object with numeric values."
  );
}

export const jsonToChart = defineTool({
  meta: {
    id: "diagram/json-to-chart",
    name: "JSON to Chart",
    description:
      "Free online JSON to chart converter — transform JSON data arrays into bar, line, pie, or scatter charts as SVG instantly in your browser. No data is stored. Automatically detects label and value fields from your data.",
    category: "diagram",
    subgroup: "Charts",
    tier: ToolTier.CLIENT,
    keywords: ["json", "chart", "convert", "data", "visualization"],
    examples: [
      {
        title: "Array of Objects",
        description: "Convert JSON array to a bar chart",
        input:
          '[{"month": "Jan", "sales": 100}, {"month": "Feb", "sales": 150}, {"month": "Mar", "sales": 120}]',
        output:
          'xychart-beta\n    title "JSON Data Chart"\n    x-axis ["Jan", "Feb", "Mar"]\n    y-axis "sales"\n    bar [100, 150, 120]',
      },
      {
        title: "Key-Value Object",
        description: "Convert a JSON object to a bar chart",
        input: '{"Chrome": 65, "Firefox": 15, "Safari": 12, "Edge": 8}',
        output:
          'xychart-beta\n    title "JSON Data Chart"\n    x-axis ["Chrome", "Firefox", "Safari", "Edge"]\n    y-axis "Value"\n    bar [65, 15, 12, 8]',
      },
    ],
    ui: {
      inputLanguage: "json",
      outputRenderer: "diagram",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
