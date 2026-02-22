import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("SVG path 'd' attribute value"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed path commands with descriptions"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const COMMAND_NAMES: Record<string, string> = {
  M: "Move to (absolute)",
  m: "Move to (relative)",
  L: "Line to (absolute)",
  l: "Line to (relative)",
  H: "Horizontal line to (absolute)",
  h: "Horizontal line to (relative)",
  V: "Vertical line to (absolute)",
  v: "Vertical line to (relative)",
  C: "Cubic bezier (absolute)",
  c: "Cubic bezier (relative)",
  S: "Smooth cubic bezier (absolute)",
  s: "Smooth cubic bezier (relative)",
  Q: "Quadratic bezier (absolute)",
  q: "Quadratic bezier (relative)",
  T: "Smooth quadratic bezier (absolute)",
  t: "Smooth quadratic bezier (relative)",
  A: "Arc (absolute)",
  a: "Arc (relative)",
  Z: "Close path",
  z: "Close path",
};

function execute(input: Input): Output {
  const pathData = input.input.trim();
  if (!pathData) throw new Error("Path data cannot be empty");

  // Parse path commands
  const commands: Array<{ command: string; params: string }> = [];
  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(pathData)) !== null) {
    commands.push({
      command: match[1]!,
      params: match[2]!.trim(),
    });
  }

  if (commands.length === 0) {
    throw new Error("No valid path commands found");
  }

  const lines: string[] = [];
  lines.push("SVG Path Analysis");
  lines.push("=================");
  lines.push("");
  lines.push(`Total commands: ${commands.length}`);
  lines.push(`Path string length: ${pathData.length}`);
  lines.push("");
  lines.push("Commands:");
  lines.push("---------");

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i]!;
    const name = COMMAND_NAMES[cmd.command] || "Unknown";
    const params = cmd.params ? ` ${cmd.params}` : "";
    lines.push(`  [${i + 1}] ${cmd.command}${params}`);
    lines.push(`      ${name}`);
  }

  // Statistics
  const commandCounts: Record<string, number> = {};
  for (const cmd of commands) {
    const upper = cmd.command.toUpperCase();
    commandCounts[upper] = (commandCounts[upper] || 0) + 1;
  }

  lines.push("");
  lines.push("Statistics:");
  lines.push("-----------");
  for (const [cmd, count] of Object.entries(commandCounts).sort()) {
    lines.push(`  ${cmd}: ${count} (${COMMAND_NAMES[cmd] || "Unknown"})`);
  }

  // Determine bounding characteristics
  const hasArcs = "A" in commandCounts;
  const hasCurves =
    "C" in commandCounts || "Q" in commandCounts || "S" in commandCounts;
  const isClosed = "Z" in commandCounts;

  lines.push("");
  lines.push("Properties:");
  lines.push(`  Closed path: ${isClosed ? "Yes" : "No"}`);
  lines.push(`  Has curves: ${hasCurves ? "Yes" : "No"}`);
  lines.push(`  Has arcs: ${hasArcs ? "Yes" : "No"}`);

  return { output: lines.join("\n") };
}

export const svgPathEditor = defineTool({
  meta: {
    id: "svg/svg-path-editor",
    name: "SVG Path Analyzer",
    description:
      "Free online SVG path analyzer — parse and visualize SVG path commands with detailed breakdowns instantly in your browser. No data is stored. Shows command types, statistics, and path properties like curves, arcs, and closure.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "path",
      "analyze",
      "parse",
      "commands",
      "d-attribute",
      "bezier",
      "arc",
      "moveto",
      "lineto",
      "curveto",
    ],
    examples: [
      {
        title: "Analyze triangle path commands",
        description: "Parse a simple triangle SVG path",
        input: "M 10 80 L 50 10 L 90 80 Z",
        output:
          "SVG Path Analysis\n=================\n\nTotal commands: 4\nPath string length: 25\n\nCommands:\n---------\n  [1] M 10 80\n      Move to (absolute)\n  [2] L 50 10\n      Line to (absolute)\n  [3] L 90 80\n      Line to (absolute)\n  [4] Z\n      Close path\n\nStatistics:\n-----------\n  L: 2 (Line to (absolute))\n  M: 1 (Move to (absolute))\n  Z: 1 (Close path)\n\nProperties:\n  Closed path: Yes\n  Has curves: No\n  Has arcs: No",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
