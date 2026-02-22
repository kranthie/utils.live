import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum(["box", "table", "tree", "flow"])
    .default("box")
    .describe("Diagram type"),
  items: z.array(z.string()).min(1).describe("Items to include in the diagram"),
  title: z.string().optional().describe("Diagram title"),
  connections: z
    .array(
      z.object({
        from: z.number().describe("Source item index"),
        to: z.number().describe("Target item index"),
      })
    )
    .default([])
    .describe("Connections between items (for flow type)"),
});

const outputSchema = z.object({
  output: z.string().describe("ASCII art diagram"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function drawBox(text: string, minWidth = 0): string[] {
  const width = Math.max(text.length + 2, minWidth);
  const top = "+" + "-".repeat(width) + "+";
  const middle = "| " + text + " ".repeat(width - text.length - 2) + " |";
  return [top, middle, top];
}

function execute(input: Input): Output {
  const lines: string[] = [];

  switch (input.type) {
    case "box": {
      if (input.title) {
        lines.push(input.title);
        lines.push("=".repeat(input.title.length));
        lines.push("");
      }
      const maxLen = Math.max(
        ...input.items.map((item: string) => item.length)
      );
      for (let i = 0; i < input.items.length; i++) {
        const box = drawBox(input.items[i] ?? "", maxLen + 2);
        lines.push(...box);
        if (i < input.items.length - 1) {
          const midpoint = Math.floor((maxLen + 4) / 2);
          lines.push(" ".repeat(midpoint) + "|");
          lines.push(" ".repeat(midpoint) + "v");
        }
      }
      break;
    }
    case "table": {
      const maxLen = Math.max(
        ...input.items.map((item: string) => item.length)
      );
      const width = maxLen + 4;
      const separator = "+" + "-".repeat(width) + "+";

      if (input.title) {
        lines.push(separator);
        const titlePad = width - input.title.length;
        const leftPad = Math.floor(titlePad / 2);
        const rightPad = titlePad - leftPad;
        lines.push(
          "|" + " ".repeat(leftPad) + input.title + " ".repeat(rightPad) + "|"
        );
        lines.push("+" + "=".repeat(width) + "+");
      } else {
        lines.push(separator);
      }

      for (const item of input.items) {
        const it = item ?? "";
        lines.push("| " + it + " ".repeat(width - it.length - 2) + " |");
        lines.push(separator);
      }
      break;
    }
    case "tree": {
      if (input.title) {
        lines.push(input.title);
      }
      for (let i = 0; i < input.items.length; i++) {
        const isLast = i === input.items.length - 1;
        const prefix = isLast ? "\\-- " : "+-- ";
        lines.push(prefix + (input.items[i] ?? ""));
      }
      break;
    }
    case "flow": {
      if (input.title) {
        lines.push(input.title);
        lines.push("=".repeat(input.title.length));
        lines.push("");
      }
      const maxLen = Math.max(
        ...input.items.map((item: string) => item.length)
      );
      const boxes = input.items.map((item: string) =>
        drawBox(item, maxLen + 2)
      );

      for (let i = 0; i < boxes.length; i++) {
        lines.push(...(boxes[i] ?? []));
        // Check for connections from this node
        const hasConnection = input.connections.some((c) => c.from === i);
        if (hasConnection) {
          const midpoint = Math.floor((maxLen + 4) / 2);
          lines.push(" ".repeat(midpoint) + "|");
          lines.push(" ".repeat(midpoint) + "v");
        }
      }
      break;
    }
  }

  return { output: lines.join("\n") };
}

export const asciiDiagram = defineTool({
  meta: {
    id: "diagram/ascii-diagram",
    name: "ASCII Diagram",
    description:
      "Free online ASCII diagram generator — create box, table, tree, and flow diagrams as ASCII art from structured input instantly in your browser. No data is stored. Supports titled sections, box connections, and file tree views.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["ascii", "art", "diagram", "box", "text", "drawing"],
    examples: [
      {
        title: "Process Boxes",
        description: "Generate a vertical flow of boxes",
        input: {
          type: "box",
          items: ["Input", "Process", "Output"],
          title: "Data Flow",
        },
        output:
          "Data Flow\n=========\n\n+---------+\n| Input   |\n+---------+\n     |\n     v\n+---------+\n| Process |\n+---------+\n     |\n     v\n+---------+\n| Output  |\n+---------+",
      },
      {
        title: "File Tree",
        description: "Generate an ASCII tree structure",
        input: {
          type: "tree",
          items: ["src", "components", "utils", "index.ts"],
          title: "Project",
        },
        output: "Project\n+-- src\n+-- components\n+-- utils\n\\-- index.ts",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
