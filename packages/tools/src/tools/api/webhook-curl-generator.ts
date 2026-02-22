import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  method: z
    .enum(["POST", "GET", "PUT", "PATCH", "DELETE"])
    .default("POST")
    .describe("HTTP method for webhook"),
  contentType: z
    .enum([
      "application/json",
      "application/x-www-form-urlencoded",
      "text/plain",
    ])
    .default("application/json")
    .describe("Content type"),
  payload: z
    .string()
    .default('{"event":"test","data":{"id":1}}')
    .describe("Sample payload"),
  headers: z
    .string()
    .default("")
    .describe("Custom headers (key: value per line)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated cURL command for webhook testing"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = [];
  lines.push("# Webhook cURL Generator");
  lines.push("");
  lines.push("Note: This tool generates cURL commands for testing webhooks.");
  lines.push(
    "To test webhooks, use a service like webhook.site, requestbin.com, or ngrok."
  );
  lines.push("");
  lines.push("## Sample Webhook URL");
  lines.push("https://webhook.site/<your-unique-id>");
  lines.push("");
  lines.push("## Test Command");
  lines.push("");

  const parts = ["curl", `-X ${input.method}`];
  parts.push(`-H 'Content-Type: ${input.contentType}'`);

  if (input.headers.trim()) {
    for (const line of input.headers.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(":")) {
        parts.push(`-H '${trimmed}'`);
      }
    }
  }

  if (input.payload.trim()) {
    parts.push(`-d '${input.payload.trim()}'`);
  }

  parts.push("'https://webhook.site/<your-unique-id>'");
  lines.push(parts.join(" \\\n  "));
  lines.push("");
  lines.push("## Payload Preview");
  lines.push("```");
  try {
    const parsed = JSON.parse(input.payload) as Record<string, unknown>;
    lines.push(JSON.stringify(parsed, null, 2));
  } catch {
    lines.push(input.payload);
  }
  lines.push("```");

  return { output: lines.join("\n") };
}

export const webhookCurlGenerator = defineTool({
  meta: {
    id: "api/webhook-curl-generator",
    name: "Webhook cURL Generator",
    description:
      "Free online webhook cURL generator — create ready-to-use cURL commands for testing webhooks with custom payloads, headers, and content types instantly in your browser. No data is stored. Works with webhook.site, requestbin, and ngrok.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "webhook",
      "curl",
      "generate",
      "http",
      "callback",
      "api",
      "test",
      "payload",
    ],
    examples: [
      {
        title: "JSON Webhook POST",
        description:
          "Generate a cURL command for testing a JSON webhook endpoint",
        input: {
          method: "POST",
          contentType: "application/json",
          payload: '{"event":"user.created","data":{"id":1,"name":"Alice"}}',
          headers: "",
        },
        output:
          '# Webhook cURL Generator\n\nNote: This tool generates cURL commands for testing webhooks.\nTo test webhooks, use a service like webhook.site, requestbin.com, or ngrok.\n\n## Sample Webhook URL\nhttps://webhook.site/<your-unique-id>\n\n## Test Command\n\ncurl \\\n  -X POST \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"event":"user.created","data":{"id":1,"name":"Alice"}}\' \\\n  \'https://webhook.site/<your-unique-id>\'\n\n## Payload Preview\n```\n{\n  "event": "user.created",\n  "data": {\n    "id": 1,\n    "name": "Alice"\n  }\n}\n```',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
