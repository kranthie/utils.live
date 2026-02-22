import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("EXPLAIN output or JSON query plan to visualize"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted visualization of the query plan"),
  nodes: z
    .array(
      z.object({
        operation: z.string(),
        details: z.string().optional(),
        cost: z.string().optional(),
        rows: z.number().optional(),
        width: z.number().optional(),
        actualTime: z.string().optional(),
        actualRows: z.number().optional(),
        loops: z.number().optional(),
      })
    )
    .describe("Parsed plan nodes"),
  totalCost: z.string().optional().describe("Total estimated cost"),
  warnings: z.array(z.string()).describe("Performance warnings"),
});

const optionsSchema = z.object({
  format: z
    .enum(["tree", "table", "text"])
    .default("tree")
    .describe("Output visualization format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

interface PlanNode {
  operation: string;
  details?: string;
  cost?: string;
  rows?: number;
  width?: number;
  actualTime?: string;
  actualRows?: number;
  loops?: number;
  children: PlanNode[];
}

/**
 * Parses PostgreSQL text EXPLAIN output.
 */
function parseTextExplain(text: string): PlanNode[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const nodeStack: Array<{ indent: number; node: PlanNode }> = [];
  const roots: PlanNode[] = [];

  for (const line of lines) {
    // Skip separator lines
    if (line.match(/^[-=]+$/) || line.match(/^QUERY PLAN$/i)) continue;

    // Determine indent level
    const match = line.match(/^(\s*(?:->)?\s*)/);
    const indent = match ? match[1]!.length : 0;

    // Parse the node
    const nodeMatch = line.match(
      /^\s*(?:->\s*)?([\w\s]+?)(?:\s+on\s+(\S+))?\s*(?:\(cost=([0-9.]+)\.\.([0-9.]+)\s+rows=(\d+)\s+width=(\d+)\))?(?:\s*\(actual time=([0-9.]+)\.\.([0-9.]+)\s+rows=(\d+)\s+loops=(\d+)\))?/
    );

    const node: PlanNode = {
      operation: "Unknown",
      children: [],
    };

    if (nodeMatch) {
      node.operation = nodeMatch[1]?.trim() ?? "Unknown";
      if (nodeMatch[2]) {
        node.details = `on ${nodeMatch[2]}`;
      }
      if (nodeMatch[3] && nodeMatch[4]) {
        node.cost = `${nodeMatch[3]}..${nodeMatch[4]}`;
      }
      if (nodeMatch[5]) {
        node.rows = parseInt(nodeMatch[5], 10);
      }
      if (nodeMatch[6]) {
        node.width = parseInt(nodeMatch[6], 10);
      }
      if (nodeMatch[7] && nodeMatch[8]) {
        node.actualTime = `${nodeMatch[7]}..${nodeMatch[8]}`;
      }
      if (nodeMatch[9]) {
        node.actualRows = parseInt(nodeMatch[9], 10);
      }
      if (nodeMatch[10]) {
        node.loops = parseInt(nodeMatch[10], 10);
      }
    } else {
      // Capture as detail text
      const trimmed = line.trim();
      if (
        trimmed.startsWith("Filter:") ||
        trimmed.startsWith("Sort Key:") ||
        trimmed.startsWith("Index Cond:") ||
        trimmed.startsWith("Hash Cond:") ||
        trimmed.startsWith("Merge Cond:") ||
        trimmed.startsWith("Join Filter:") ||
        trimmed.startsWith("Recheck Cond:") ||
        trimmed.startsWith("Rows Removed by Filter:") ||
        trimmed.startsWith("Buffers:") ||
        trimmed.startsWith("Planning Time:") ||
        trimmed.startsWith("Execution Time:")
      ) {
        // Add to the last node if possible
        if (nodeStack.length > 0) {
          const lastNode = nodeStack[nodeStack.length - 1]!.node;
          lastNode.details = lastNode.details
            ? `${lastNode.details}; ${trimmed}`
            : trimmed;
        }
        continue;
      }
      node.operation = trimmed;
    }

    // Build tree structure
    while (
      nodeStack.length > 0 &&
      nodeStack[nodeStack.length - 1]!.indent >= indent
    ) {
      nodeStack.pop();
    }

    if (nodeStack.length > 0) {
      nodeStack[nodeStack.length - 1]!.node.children.push(node);
    } else {
      roots.push(node);
    }

    nodeStack.push({ indent, node });
  }

  return roots;
}

/**
 * Parses JSON EXPLAIN output (PostgreSQL EXPLAIN (FORMAT JSON)).
 */
function parseJsonExplain(json: unknown): PlanNode[] {
  const plans = Array.isArray(json) ? json : [json];
  const nodes: PlanNode[] = [];

  for (const plan of plans) {
    const planObj: unknown = (plan as Record<string, unknown>).Plan ?? plan;
    if (planObj && typeof planObj === "object") {
      nodes.push(parsePlanObject(planObj as Record<string, unknown>));
    }
  }

  return nodes;
}

function toStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val as string | number | boolean);
}

function parsePlanObject(obj: Record<string, unknown>): PlanNode {
  const node: PlanNode = {
    operation: toStr(obj["Node Type"] ?? obj["nodeType"] ?? "Unknown"),
    children: [],
  };

  if (obj["Relation Name"]) {
    node.details = `on ${toStr(obj["Relation Name"])}`;
  }

  if (obj["Total Cost"] !== undefined && obj["Startup Cost"] !== undefined) {
    node.cost = `${toStr(obj["Startup Cost"])}..${toStr(obj["Total Cost"])}`;
  }

  if (obj["Plan Rows"] !== undefined) {
    node.rows = Number(obj["Plan Rows"]);
  }

  if (obj["Plan Width"] !== undefined) {
    node.width = Number(obj["Plan Width"]);
  }

  if (
    obj["Actual Total Time"] !== undefined &&
    obj["Actual Startup Time"] !== undefined
  ) {
    node.actualTime = `${toStr(obj["Actual Startup Time"])}..${toStr(obj["Actual Total Time"])}`;
  }

  if (obj["Actual Rows"] !== undefined) {
    node.actualRows = Number(obj["Actual Rows"]);
  }

  if (obj["Actual Loops"] !== undefined) {
    node.loops = Number(obj["Actual Loops"]);
  }

  // Extra details
  const detailParts: string[] = [];
  if (obj["Filter"]) detailParts.push(`Filter: ${toStr(obj["Filter"])}`);
  if (obj["Index Cond"])
    detailParts.push(`Index Cond: ${toStr(obj["Index Cond"])}`);
  if (obj["Hash Cond"])
    detailParts.push(`Hash Cond: ${toStr(obj["Hash Cond"])}`);
  if (obj["Sort Key"]) {
    const sortKey = obj["Sort Key"];
    const keys = Array.isArray(sortKey)
      ? (sortKey as string[]).join(", ")
      : toStr(sortKey);
    detailParts.push(`Sort Key: ${keys}`);
  }
  if (detailParts.length > 0) {
    node.details = node.details
      ? `${node.details}; ${detailParts.join("; ")}`
      : detailParts.join("; ");
  }

  // Children
  const plans = (obj["Plans"] ?? obj["plans"]) as
    | Record<string, unknown>[]
    | undefined;
  if (Array.isArray(plans)) {
    for (const child of plans) {
      node.children.push(parsePlanObject(child));
    }
  }

  return node;
}

/**
 * Flattens tree nodes into a flat list for output.
 */
function flattenNodes(nodes: PlanNode[]): Array<{
  operation: string;
  details?: string;
  cost?: string;
  rows?: number;
  width?: number;
  actualTime?: string;
  actualRows?: number;
  loops?: number;
}> {
  const result: Array<{
    operation: string;
    details?: string;
    cost?: string;
    rows?: number;
    width?: number;
    actualTime?: string;
    actualRows?: number;
    loops?: number;
  }> = [];

  function walk(node: PlanNode): void {
    const entry: {
      operation: string;
      details?: string;
      cost?: string;
      rows?: number;
      width?: number;
      actualTime?: string;
      actualRows?: number;
      loops?: number;
    } = { operation: node.operation };
    if (node.details !== undefined) entry.details = node.details;
    if (node.cost !== undefined) entry.cost = node.cost;
    if (node.rows !== undefined) entry.rows = node.rows;
    if (node.width !== undefined) entry.width = node.width;
    if (node.actualTime !== undefined) entry.actualTime = node.actualTime;
    if (node.actualRows !== undefined) entry.actualRows = node.actualRows;
    if (node.loops !== undefined) entry.loops = node.loops;
    result.push(entry);
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const node of nodes) {
    walk(node);
  }

  return result;
}

/**
 * Renders tree format.
 */
function renderTree(nodes: PlanNode[], indent: number = 0): string {
  const lines: string[] = [];

  for (const node of nodes) {
    const prefix = indent === 0 ? "" : `${"  ".repeat(indent)}-> `;
    let line = `${prefix}${node.operation}`;

    if (node.details) {
      line += ` (${node.details})`;
    }

    if (node.cost) {
      line += ` [cost=${node.cost}]`;
    }

    if (node.rows !== undefined) {
      line += ` [rows=${node.rows}]`;
    }

    if (node.actualTime) {
      line += ` [time=${node.actualTime}ms]`;
    }

    if (node.actualRows !== undefined) {
      line += ` [actual_rows=${node.actualRows}]`;
    }

    lines.push(line);

    if (node.children.length > 0) {
      lines.push(renderTree(node.children, indent + 1));
    }
  }

  return lines.join("\n");
}

/**
 * Renders table format.
 */
function renderTable(nodes: PlanNode[]): string {
  const flat = flattenNodes(nodes);
  const header =
    "| # | Operation | Cost | Est. Rows | Actual Rows | Time (ms) |";
  const separator =
    "|---|-----------|------|-----------|-------------|-----------|";
  const rows = flat.map((n, i) => {
    return `| ${i + 1} | ${n.operation} | ${n.cost ?? "-"} | ${n.rows ?? "-"} | ${n.actualRows ?? "-"} | ${n.actualTime ?? "-"} |`;
  });

  return [header, separator, ...rows].join("\n");
}

/**
 * Generates performance warnings.
 */
function generateWarnings(nodes: PlanNode[]): string[] {
  const warnings: string[] = [];

  function check(node: PlanNode): void {
    const opUpper = node.operation.toUpperCase();

    if (opUpper.includes("SEQ SCAN") || opUpper.includes("SEQUENTIAL SCAN")) {
      if (node.rows !== undefined && node.rows > 1000) {
        warnings.push(
          `Sequential scan on ${node.details ?? "table"} with ${node.rows} estimated rows. Consider adding an index.`
        );
      }
    }

    if (opUpper.includes("SORT")) {
      if (node.details?.includes("Sort Key")) {
        warnings.push(
          `Sort operation detected. Consider adding an index on the sort columns to avoid sorting.`
        );
      }
    }

    if (opUpper.includes("NESTED LOOP")) {
      if (node.rows !== undefined && node.rows > 10000) {
        warnings.push(
          `Nested Loop with ${node.rows} estimated rows may be slow. Consider hash or merge join.`
        );
      }
    }

    if (
      opUpper.includes("HASH JOIN") &&
      node.rows !== undefined &&
      node.rows > 100000
    ) {
      warnings.push(
        `Large Hash Join with ${node.rows} rows. Ensure sufficient work_mem.`
      );
    }

    // Check for estimation mismatch
    if (node.rows !== undefined && node.actualRows !== undefined) {
      const ratio = node.actualRows / Math.max(node.rows, 1);
      if (ratio > 10 || ratio < 0.1) {
        warnings.push(
          `Estimation mismatch for ${node.operation}: estimated ${node.rows} rows but got ${node.actualRows}. Consider running ANALYZE.`
        );
      }
    }

    for (const child of node.children) {
      check(child);
    }
  }

  for (const node of nodes) {
    check(node);
  }

  return warnings;
}

/**
 * Parses and visualizes EXPLAIN output.
 */
function execute(input: Input, options?: Options): Output {
  const text = input.input.trim();
  if (!text) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "EXPLAIN output is empty",
    });
  }

  const format = options?.format ?? "tree";
  let nodes: PlanNode[] = [];

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    nodes = parseJsonExplain(parsed);
  } catch {
    // Parse as text format
    nodes = parseTextExplain(text);
  }

  if (nodes.length === 0) {
    throw createToolError({
      code: EXEC_FAILED,
      message: "Could not parse any query plan nodes from the input",
    });
  }

  let output: string;
  switch (format) {
    case "tree":
      output = renderTree(nodes);
      break;
    case "table":
      output = renderTable(nodes);
      break;
    case "text":
      output = renderTree(nodes);
      break;
    default:
      output = renderTree(nodes);
  }

  // Extract total cost
  let totalCost: string | undefined;
  if (nodes.length > 0 && nodes[0]!.cost) {
    const costParts = nodes[0]!.cost.split("..");
    totalCost = costParts[costParts.length - 1];
  }

  const warnings = generateWarnings(nodes);
  const flatNodes = flattenNodes(nodes);

  return {
    output,
    nodes: flatNodes,
    totalCost,
    warnings,
  };
}

/**
 * EXPLAIN Visualizer tool.
 * Visualizes query execution plans from EXPLAIN output.
 */
export const sqlExplainVisualizer = defineTool({
  meta: {
    id: "sql/explain-visualizer",
    name: "EXPLAIN Visualizer",
    description:
      "Free online SQL EXPLAIN visualizer — parse and visualize PostgreSQL and MySQL query execution plans instantly in your browser. No data is stored. Shows scan types, costs, row estimates, and performance warnings.",
    category: "sql",
    subgroup: "Database Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "sql",
      "explain",
      "plan",
      "visualize",
      "performance",
      "query",
      "optimize",
    ],
    examples: [
      {
        title: "PostgreSQL JSON EXPLAIN",
        description:
          "Visualize a PostgreSQL query execution plan from JSON format output",
        input:
          '[{"Plan":{"Node Type":"Seq Scan","Relation Name":"users","Startup Cost":0.00,"Total Cost":35.50,"Plan Rows":2550,"Plan Width":36,"Filter":"(active = true)"}}]',
        output:
          "Seq Scan (on users; Filter: (active = true)) [cost=0..35.5] [rows=2550]",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
