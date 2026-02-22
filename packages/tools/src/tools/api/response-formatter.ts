import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("API response body (JSON or XML)"),
});

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).default(2).describe("Indentation spaces"),
  sortKeys: z.boolean().default(false).describe("Sort object keys"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted response"),
});

function sortObjectKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

function formatXml(xml: string, indent: number): string {
  const pad = " ".repeat(indent);
  let formatted = "";
  let depth = 0;
  const parts = xml.replace(/(>)(<)/g, "$1\n$2").split("\n");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("</")) depth--;
    formatted += pad.repeat(Math.max(0, depth)) + trimmed + "\n";
    if (
      trimmed.startsWith("<") &&
      !trimmed.startsWith("</") &&
      !trimmed.startsWith("<?") &&
      !trimmed.endsWith("/>") &&
      !trimmed.includes("</")
    ) {
      depth++;
    }
  }
  return formatted.trimEnd();
}

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const indent = options?.indent ?? 2;
  const sortKeys = options?.sortKeys ?? false;

  // Try JSON first
  try {
    let parsed: unknown = JSON.parse(text);
    if (sortKeys) parsed = sortObjectKeys(parsed);
    return { output: JSON.stringify(parsed, null, indent) };
  } catch {
    // Not JSON
  }

  // Try XML
  if (text.startsWith("<")) {
    return { output: formatXml(text, indent) };
  }

  throw new Error("Input is not valid JSON or XML");
}

export const responseFormatter = defineTool({
  meta: {
    id: "api/response-formatter",
    name: "API Response Formatter",
    description:
      "Free online API response formatter — pretty-print JSON and XML API responses with configurable indentation and optional key sorting instantly in your browser. No data is stored.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "api",
      "response",
      "format",
      "json",
      "xml",
      "pretty",
      "indent",
      "beautify",
    ],
    ui: { outputLanguage: "json" },
    examples: [
      {
        title: "Format JSON API Response",
        description:
          "Pretty-print a minified JSON API response with 2-space indentation",
        input:
          '{"id":1,"name":"Alice","email":"alice@example.com","roles":["admin","user"]}',
        output:
          '{\n  "id": 1,\n  "name": "Alice",\n  "email": "alice@example.com",\n  "roles": [\n    "admin",\n    "user"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
