import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

interface MindMapNode {
  text: string;
  shape?:
    | "default"
    | "square"
    | "rounded"
    | "circle"
    | "bang"
    | "cloud"
    | "hexagon";
  children?: MindMapNode[];
}

const mindMapNodeSchema: z.ZodType<MindMapNode> = z.lazy(() =>
  z.object({
    text: z.string().describe("Node text"),
    shape: z
      .enum([
        "default",
        "square",
        "rounded",
        "circle",
        "bang",
        "cloud",
        "hexagon",
      ])
      .default("default")
      .describe("Node shape"),
    children: z.array(mindMapNodeSchema).default([]).describe("Child nodes"),
  })
) as z.ZodType<MindMapNode>;

const inputSchema = z.object({
  root: mindMapNodeSchema.describe("Root node of the mind map"),
});

const outputSchema = z.object({
  output: z.string().describe("Mermaid mindmap syntax"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const shapeWrappers: Record<string, [string, string]> = {
  default: ["", ""],
  square: ["[", "]"],
  rounded: ["(", ")"],
  circle: ["((", "))"],
  bang: ["))", "(("],
  cloud: [")", "("],
  hexagon: ["{{", "}}"],
};

function renderNode(node: MindMapNode, depth: number): string[] {
  const indent = "    ".repeat(depth);
  const [open, close] = shapeWrappers[node.shape || "default"] || ["", ""];
  const lines: string[] = [];

  if (open && close) {
    lines.push(`${indent}${open}${node.text}${close}`);
  } else {
    lines.push(`${indent}${node.text}`);
  }

  if (node.children) {
    for (const child of node.children) {
      lines.push(...renderNode(child, depth + 1));
    }
  }

  return lines;
}

function execute(input: Input): Output {
  const lines: string[] = ["mindmap"];
  lines.push(...renderNode(input.root, 1));
  return { output: lines.join("\n") };
}

export const mindMapEditor = defineTool({
  meta: {
    id: "diagram/mind-map-editor",
    name: "Mind Map Editor",
    description:
      "Free online mind map editor — generate Mermaid mind map syntax from a hierarchical tree of topics instantly in your browser. No data is stored. Supports unlimited nesting depth and auto-indented output.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["mindmap", "mind", "map", "brainstorm", "diagram", "mermaid"],
    examples: [
      {
        title: "Project Planning",
        description: "Generate a mind map for project planning",
        input: {
          root: {
            text: "Project",
            shape: "default",
            children: [
              {
                text: "Frontend",
                shape: "square",
                children: [
                  { text: "React", shape: "rounded", children: [] },
                  { text: "CSS", shape: "rounded", children: [] },
                ],
              },
              {
                text: "Backend",
                shape: "square",
                children: [
                  { text: "Node.js", shape: "rounded", children: [] },
                  { text: "Database", shape: "rounded", children: [] },
                ],
              },
            ],
          },
        },
        output:
          "mindmap\n    Project\n        [Frontend]\n            (React)\n            (CSS)\n        [Backend]\n            (Node.js)\n            (Database)",
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
