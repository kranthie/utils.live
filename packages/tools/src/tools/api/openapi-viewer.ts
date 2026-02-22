import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in YAML or JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted OpenAPI spec display"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseSpec(input: string): Record<string, unknown> {
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }
  // Simple YAML-like parsing for common OpenAPI structure
  const result: Record<string, unknown> = {};
  const lines = trimmed.split("\n");
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: result, indent: -1 },
  ];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.search(/\S/);
    const content = line.trim();
    const colonIdx = content.indexOf(":");
    if (colonIdx === -1) continue;

    const key = content.substring(0, colonIdx).trim();
    let value = content.substring(colonIdx + 1).trim();

    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1]!.obj;

    if (value === "" || value === "|" || value === ">") {
      const child: Record<string, unknown> = {};
      current[key] = child;
      stack.push({ obj: child, indent });
    } else {
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      if (value === "true") current[key] = true;
      else if (value === "false") current[key] = false;
      else if (value === "null") current[key] = null;
      else if (!isNaN(Number(value)) && value !== "")
        current[key] = Number(value);
      else current[key] = value;
    }
  }

  return result;
}

function formatPaths(paths: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [path, methods] of Object.entries(paths)) {
    if (typeof methods === "object" && methods !== null) {
      for (const [method, details] of Object.entries(
        methods as Record<string, unknown>
      )) {
        const summary =
          typeof details === "object" && details !== null
            ? (((details as Record<string, unknown>).summary as string) ?? "")
            : "";
        lines.push(
          `  ${method.toUpperCase().padEnd(8)} ${path}${summary ? ` - ${summary}` : ""}`
        );
      }
    }
  }
  return lines.join("\n");
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const spec = parseSpec(input.input);
  const lines: string[] = [];

  const info = spec.info as Record<string, unknown> | undefined;
  const title = typeof info?.title === "string" ? info.title : "Untitled API";
  const version = typeof info?.version === "string" ? info.version : "unknown";
  const description =
    typeof info?.description === "string" ? info.description : "";

  lines.push(`# ${title} (v${version})`);
  if (description) lines.push(`\n${description}`);

  if (spec.openapi)
    lines.push(`\nOpenAPI Version: ${String(spec.openapi as string | number)}`);
  if (spec.swagger)
    lines.push(`\nSwagger Version: ${String(spec.swagger as string | number)}`);

  const servers = spec.servers as Array<Record<string, unknown>> | undefined;
  if (servers && Array.isArray(servers) && servers.length > 0) {
    lines.push("\n## Servers");
    for (const server of servers) {
      const serverDesc =
        typeof server.description === "string" ? server.description : "";
      lines.push(
        `  - ${String(server.url as string)}${serverDesc ? ` (${serverDesc})` : ""}`
      );
    }
  }

  const paths = spec.paths as Record<string, unknown> | undefined;
  if (paths && typeof paths === "object") {
    lines.push("\n## Endpoints");
    lines.push(formatPaths(paths));
  }

  const components = spec.components as Record<string, unknown> | undefined;
  if (components) {
    const schemas = components.schemas as Record<string, unknown> | undefined;
    if (schemas) {
      lines.push(`\n## Schemas (${Object.keys(schemas).length})`);
      for (const name of Object.keys(schemas)) {
        lines.push(`  - ${name}`);
      }
    }
  }

  const tags = spec.tags as Array<Record<string, unknown>> | undefined;
  if (tags && Array.isArray(tags)) {
    lines.push("\n## Tags");
    for (const tag of tags) {
      const tagDesc =
        typeof tag.description === "string" ? tag.description : "";
      lines.push(
        `  - ${String(tag.name as string)}${tagDesc ? `: ${tagDesc}` : ""}`
      );
    }
  }

  return { output: lines.join("\n") };
}

export const openapiViewer = defineTool({
  meta: {
    id: "api/openapi-viewer",
    name: "OpenAPI Viewer",
    description:
      "Free online OpenAPI viewer — display OpenAPI and Swagger specifications in a human-readable format with endpoint summaries, server info, and schema lists instantly in your browser. No data is stored.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "swagger",
      "api",
      "viewer",
      "spec",
      "documentation",
      "display",
      "readable",
    ],
    examples: [
      {
        title: "View Pet Store API",
        description:
          "Display an OpenAPI spec as a readable summary with endpoints",
        input:
          '{"openapi":"3.0.3","info":{"title":"Pet Store","version":"1.0.0","description":"A sample API"},"paths":{"/pets":{"get":{"summary":"List pets"}},"/pets/{id}":{"get":{"summary":"Get pet"}}}}',
        output:
          "# Pet Store (v1.0.0)\n\nA sample API\n\nOpenAPI Version: 3.0.3\n\n## Endpoints\n  GET      /pets - List pets\n  GET      /pets/{id} - Get pet",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
