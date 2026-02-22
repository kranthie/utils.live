import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Graphviz DOT language syntax"),
});

const outputSchema = z.object({
  output: z.string().describe("DOT syntax analysis and validation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const code = input.input.trim();
  if (!code) {
    throw new Error("Graphviz DOT syntax cannot be empty");
  }

  // Detect graph type
  const isDigraph = /^\s*digraph\b/m.test(code);
  const isGraph = /^\s*graph\b/m.test(code);
  const isSubgraph = /subgraph\b/.test(code);

  // Count nodes and edges
  const nodePattern = /^\s*(\w+)\s*\[/gm;
  const directedEdgePattern = /->/g;
  const undirectedEdgePattern = /--/g;

  const nodes = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = nodePattern.exec(code)) !== null) {
    if (
      match[1] &&
      !["graph", "digraph", "subgraph", "node", "edge"].includes(match[1])
    ) {
      nodes.add(match[1]);
    }
  }

  const directedEdges = (code.match(directedEdgePattern) || []).length;
  const undirectedEdges =
    (code.match(undirectedEdgePattern) || []).length - directedEdges;

  const lines: string[] = [];
  lines.push("Graphviz DOT Analysis");
  lines.push("=====================");
  lines.push("");
  lines.push(
    `Graph type: ${isDigraph ? "Directed graph (digraph)" : isGraph ? "Undirected graph" : "Unknown"}`
  );
  lines.push(`Has subgraphs: ${isSubgraph}`);
  lines.push(`Node definitions: ${nodes.size}`);
  lines.push(`Directed edges (->): ${directedEdges}`);
  lines.push(`Undirected edges (--): ${Math.max(0, undirectedEdges)}`);
  lines.push(`Line count: ${code.split("\n").length}`);
  lines.push("");
  lines.push("Note: Graphviz rendering requires the Graphviz engine.");
  lines.push(
    "Use https://dreampuf.github.io/GraphvizOnline/ for online rendering."
  );
  lines.push("");
  lines.push("--- Source ---");
  lines.push(code);

  return { output: lines.join("\n") };
}

export const graphvizAnalyzer = defineTool({
  meta: {
    id: "diagram/graphviz-analyzer",
    name: "Graphviz Analyzer",
    description:
      "Free online Graphviz DOT analyzer — parse DOT graph definitions and extract nodes, edges, and graph properties instantly in your browser. No data is stored. Analyzes directed and undirected graphs with subgraph support.",
    category: "diagram",
    subgroup: "Diagrams",
    tier: ToolTier.CLIENT,
    keywords: ["graphviz", "dot", "graph", "diagram", "analyze"],
    examples: [
      {
        title: "Analyze Digraph",
        description: "Analyze a simple directed graph in DOT syntax",
        input:
          'digraph G {\n    A [label="Start"]\n    B [label="End"]\n    A -> B\n}',
        output:
          'Graphviz DOT Analysis\n=====================\n\nGraph type: Directed graph (digraph)\nHas subgraphs: false\nNode definitions: 2\nDirected edges (->): 1\nUndirected edges (--): 0\nLine count: 5\n\nNote: Graphviz rendering requires the Graphviz engine.\nUse https://dreampuf.github.io/GraphvizOnline/ for online rendering.\n\n--- Source ---\ndigraph G {\n    A [label="Start"]\n    B [label="End"]\n    A -> B\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
