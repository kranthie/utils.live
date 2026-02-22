import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Mermaid diagram syntax to edit and preview"),
});

const optionsSchema = z.object({
  theme: z
    .enum(["default", "dark", "forest", "neutral"])
    .default("default")
    .describe("Mermaid theme"),
  direction: z
    .enum(["TB", "TD", "BT", "RL", "LR"])
    .optional()
    .describe("Diagram direction (for flowcharts/graphs)"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid diagram syntax with applied options"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const code = input.input.trim();
  if (!code) {
    throw new Error("Mermaid diagram syntax cannot be empty");
  }

  const theme = options?.theme ?? "default";
  const direction = options?.direction;

  let result = code;

  // Add theme directive if not default
  if (theme !== "default" && !code.startsWith("%%{")) {
    result = `%%{init: {'theme': '${theme}'}}%%\n${result}`;
  }

  // Update direction for flowchart/graph diagrams
  if (direction) {
    result = result.replace(
      /^(graph|flowchart)\s+(TB|TD|BT|RL|LR)/m,
      `$1 ${direction}`
    );
  }

  return { output: result };
}

export const mermaidEditor = defineTool({
  meta: {
    id: "diagram/mermaid-editor",
    name: "Mermaid Editor",
    description:
      "Free online Mermaid editor — edit Mermaid diagram syntax with theme and direction options and preview the rendered result instantly in your browser. No data is stored. Supports default, dark, forest, and neutral themes.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["mermaid", "editor", "diagram", "preview", "theme"],
    examples: [
      {
        title: "Simple Flowchart",
        description: "Edit a simple Mermaid flowchart with default theme",
        input: "graph TD\n    A[Start] --> B[Process]\n    B --> C[End]",
        output: "graph TD\n    A[Start] --> B[Process]\n    B --> C[End]",
      },
    ],
    ui: {
      outputRenderer: "diagram",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
