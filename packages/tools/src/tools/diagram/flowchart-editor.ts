import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  direction: z
    .enum(["TB", "TD", "BT", "RL", "LR"])
    .default("TD")
    .describe("Flow direction"),
  nodes: z
    .array(
      z.object({
        id: z.string().describe("Node identifier"),
        label: z.string().describe("Node display label"),
        shape: z
          .enum([
            "rectangle",
            "rounded",
            "stadium",
            "circle",
            "diamond",
            "hexagon",
            "parallelogram",
          ])
          .default("rectangle")
          .describe("Node shape"),
      })
    )
    .min(1)
    .describe("Flowchart nodes"),
  edges: z
    .array(
      z.object({
        from: z.string().describe("Source node ID"),
        to: z.string().describe("Target node ID"),
        label: z.string().optional().describe("Edge label"),
        style: z
          .enum(["solid", "dotted", "thick"])
          .default("solid")
          .describe("Edge style"),
      })
    )
    .default([])
    .describe("Connections between nodes"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid flowchart syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const shapeWrappers: Record<string, [string, string]> = {
  rectangle: ["[", "]"],
  rounded: ["(", ")"],
  stadium: ["([", "])"],
  circle: ["((", "))"],
  diamond: ["{", "}"],
  hexagon: ["{{", "}}"],
  parallelogram: ["[/", "/]"],
};

function execute(input: Input): Output {
  const lines: string[] = [`flowchart ${input.direction || "TD"}`];

  for (const node of input.nodes) {
    const [open, close] = shapeWrappers[node.shape || "rectangle"] || [
      "[",
      "]",
    ];
    lines.push(`    ${node.id}${open}"${node.label}"${close}`);
  }

  for (const edge of input.edges) {
    let arrow: string;
    switch (edge.style) {
      case "dotted":
        arrow = edge.label ? `-. "${edge.label}" .->` : "-.->";
        break;
      case "thick":
        arrow = edge.label ? `== "${edge.label}" ==>` : "==>";
        break;
      default:
        arrow = edge.label ? `-- "${edge.label}" -->` : "-->";
        break;
    }
    lines.push(`    ${edge.from} ${arrow} ${edge.to}`);
  }

  return { output: lines.join("\n") };
}

export const flowchartEditor = defineTool({
  meta: {
    id: "diagram/flowchart-editor",
    name: "Flowchart Editor",
    description:
      "Free online flowchart editor — generate Mermaid flowchart syntax from nodes and edges with customizable shapes and arrow styles instantly in your browser. No data is stored. Supports rectangle, diamond, stadium, circle, and hexagon node shapes.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["flowchart", "diagram", "mermaid", "flow", "process"],
    examples: [
      {
        title: "Login Flow",
        description: "Generate a login process flowchart",
        input: {
          direction: "TD",
          nodes: [
            { id: "A", label: "Login Page", shape: "rectangle" },
            { id: "B", label: "Valid?", shape: "diamond" },
            { id: "C", label: "Dashboard", shape: "rounded" },
            { id: "D", label: "Error", shape: "stadium" },
          ],
          edges: [
            { from: "A", to: "B", label: "Submit", style: "solid" },
            { from: "B", to: "C", label: "Yes", style: "solid" },
            { from: "B", to: "D", label: "No", style: "dotted" },
          ],
        },
        output:
          'flowchart TD\n    A["Login Page"]\n    B{"Valid?"}\n    C("Dashboard")\n    D(["Error"])\n    A -- "Submit" --> B\n    B -- "Yes" --> C\n    B -. "No" .-> D',
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
