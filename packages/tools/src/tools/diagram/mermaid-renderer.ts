import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Mermaid diagram syntax to render"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Valid Mermaid diagram syntax ready for rendering"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const code = input.input.trim();
  if (!code) {
    throw new Error("Mermaid diagram syntax cannot be empty");
  }

  const validPrefixes = [
    "graph",
    "flowchart",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "gantt",
    "pie",
    "gitgraph",
    "mindmap",
    "timeline",
    "journey",
    "quadrantChart",
    "requirementDiagram",
    "C4Context",
    "sankey",
    "xychart",
    "block",
    "---",
    "%%",
  ];

  const firstLine = (code.split("\n")[0] ?? "").trim();
  const isValid = validPrefixes.some(
    (prefix) =>
      firstLine.startsWith(prefix) ||
      firstLine.startsWith(`%%{`) ||
      firstLine.startsWith("---")
  );

  if (!isValid) {
    throw new Error(
      `Invalid Mermaid syntax. Diagram must start with a valid type keyword (e.g., graph, flowchart, sequenceDiagram, etc.). Got: "${firstLine}"`
    );
  }

  return { output: code };
}

export const mermaidRenderer = defineTool({
  meta: {
    id: "diagram/mermaid-renderer",
    name: "Mermaid Renderer",
    description:
      "Free online Mermaid renderer — validate and render Mermaid diagram syntax for flowcharts, sequences, ER diagrams, and more instantly in your browser. No data is stored. Detects diagram type and reports syntax errors.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["mermaid", "diagram", "render", "flowchart", "chart"],
    examples: [
      {
        title: "Render Flowchart",
        description: "Render a Mermaid flowchart diagram",
        input:
          "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]",
        output:
          "graph TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]",
      },
      {
        title: "Render Sequence Diagram",
        description: "Render a Mermaid sequence diagram",
        input:
          "sequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi back",
        output:
          "sequenceDiagram\n    Alice->>Bob: Hello\n    Bob-->>Alice: Hi back",
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
