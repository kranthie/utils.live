import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  url: z
    .string()
    .default("https://api.example.com/endpoint")
    .describe("Request URL"),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .default("GET")
    .describe("HTTP method"),
  headers: z
    .string()
    .default("")
    .describe("Headers (JSON object or key: value per line)"),
  body: z.string().default("").describe("Request body"),
  queryParams: z
    .string()
    .default("")
    .describe("Query parameters (key=value per line)"),
  format: z
    .enum(["fetch", "curl", "httpie", "wget"])
    .default("fetch")
    .describe("Output format"),
});

const outputSchema = z.object({
  output: z.string().describe("Built HTTP request"),
});

function parseHeaders(input: string): Record<string, string> {
  const trimmed = input.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as Record<string, string>;
  } catch {
    const headers: Record<string, string> = {};
    for (const line of trimmed.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
      }
    }
    return headers;
  }
}

function buildUrl(base: string, params: string): string {
  if (!params.trim()) return base;
  const pairs = params
    .trim()
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return `${encodeURIComponent(l.substring(0, idx).trim())}=${encodeURIComponent(l.substring(idx + 1).trim())}`;
    });
  if (pairs.length === 0) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${pairs.join("&")}`;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const url = buildUrl(input.url, input.queryParams);
  const headers = parseHeaders(input.headers);
  const body = input.body.trim();
  const method = input.method;

  switch (input.format) {
    case "curl": {
      const parts = ["curl"];
      if (method !== "GET") parts.push(`-X ${method}`);
      for (const [k, v] of Object.entries(headers))
        parts.push(`-H '${k}: ${v}'`);
      if (body) parts.push(`-d '${body}'`);
      parts.push(`'${url}'`);
      return { output: parts.join(" \\\n  ") };
    }
    case "httpie": {
      const parts = ["http", method, `'${url}'`];
      for (const [k, v] of Object.entries(headers)) parts.push(`'${k}:${v}'`);
      if (body) {
        try {
          JSON.parse(body);
          parts.unshift("echo", `'${body}'`, "|");
        } catch {
          parts.push(`--raw='${body}'`);
        }
      }
      return { output: parts.join(" ") };
    }
    case "wget": {
      const parts = ["wget"];
      if (method !== "GET") parts.push(`--method=${method}`);
      for (const [k, v] of Object.entries(headers))
        parts.push(`--header='${k}: ${v}'`);
      if (body) parts.push(`--body-data='${body}'`);
      parts.push(`'${url}'`);
      return { output: parts.join(" \\\n  ") };
    }
    default: {
      const opts: string[] = [];
      if (method !== "GET") opts.push(`  method: "${method}",`);
      if (Object.keys(headers).length > 0) {
        opts.push(
          `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, "\n  ")},`
        );
      }
      if (body) opts.push(`  body: ${JSON.stringify(body)},`);
      if (opts.length === 0) {
        return {
          output: `const response = await fetch("${url}");\nconst data = await response.json();`,
        };
      }
      return {
        output: `const response = await fetch("${url}", {\n${opts.join("\n")}\n});\nconst data = await response.json();`,
      };
    }
  }
}

export const requestBuilder = defineTool({
  meta: {
    id: "api/request-builder",
    name: "HTTP Request Builder",
    description:
      "Free online HTTP request builder — construct HTTP requests in fetch, cURL, HTTPie, or wget format with custom headers, body, and query parameters instantly in your browser. No data is stored.",
    category: "api",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "http",
      "request",
      "builder",
      "api",
      "fetch",
      "curl",
      "httpie",
      "wget",
    ],
    examples: [
      {
        title: "POST Request as cURL",
        description:
          "Build a POST request with JSON body and auth header in cURL format",
        input: {
          url: "https://api.example.com/users",
          method: "POST",
          headers:
            '{"Content-Type":"application/json","Authorization":"Bearer token123"}',
          body: '{"name":"Alice"}',
          queryParams: "",
          format: "curl",
        },
        output:
          "curl \\\n  -X POST \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer token123' \\\n  -d '{\"name\":\"Alice\"}' \\\n  'https://api.example.com/users'",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
