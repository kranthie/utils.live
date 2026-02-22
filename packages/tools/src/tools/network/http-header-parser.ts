import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Raw HTTP headers (one per line, key: value format)"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed headers in structured JSON format"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const lines = text.split("\n");
  const headers: Record<string, string> = {};
  const parsed: Array<{ name: string; value: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip HTTP status line
    if (/^HTTP\/[\d.]+\s+\d+/.test(trimmed)) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex <= 0) continue;

    const name = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    headers[name] = value;
    parsed.push({ name, value });
  }

  if (parsed.length === 0) {
    throw new Error(
      "No valid headers found. Each header should be in 'Name: Value' format."
    );
  }

  const output = JSON.stringify(
    { headerCount: parsed.length, headers, details: parsed },
    null,
    2
  );
  return { output };
}

export const httpHeaderParser = defineTool({
  meta: {
    id: "network/http-header-parser",
    name: "HTTP Header Parser",
    description:
      "Free online HTTP header parser — paste raw headers and get structured JSON with header count, key-value pairs, and details instantly in your browser. No data is stored. Handles request and response headers, skips HTTP status lines.",
    category: "network",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "http",
      "header",
      "parse",
      "request",
      "response",
      "json",
      "structured",
    ],
    ui: { outputLanguage: "json" as const },
    examples: [
      {
        title: "Parse three common response headers",
        description:
          "Parse Content-Type, Cache-Control, and X-Request-Id into structured JSON",
        input:
          "Content-Type: application/json\nCache-Control: no-cache\nX-Request-Id: abc-123",
        output:
          '{"output":"{\\n  \\"headerCount\\": 3,\\n  \\"headers\\": {\\n    \\"Content-Type\\": \\"application/json\\",\\n    \\"Cache-Control\\": \\"no-cache\\",\\n    \\"X-Request-Id\\": \\"abc-123\\"\\n  },\\n  \\"details\\": [\\n    {\\n      \\"name\\": \\"Content-Type\\",\\n      \\"value\\": \\"application/json\\"\\n    },\\n    {\\n      \\"name\\": \\"Cache-Control\\",\\n      \\"value\\": \\"no-cache\\"\\n    },\\n    {\\n      \\"name\\": \\"X-Request-Id\\",\\n      \\"value\\": \\"abc-123\\"\\n    }\\n  ]\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
