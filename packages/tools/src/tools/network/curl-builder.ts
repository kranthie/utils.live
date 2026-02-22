import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { INPUT_INVALID_FORMAT } from "../../core/error-codes";

const headerSchema = z.object({
  key: z.string().describe("Header name"),
  value: z.string().describe("Header value"),
});

const inputSchema = z.object({
  url: z.string().describe("Target URL"),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .default("GET")
    .describe("HTTP method"),
  headers: z.array(headerSchema).default([]).describe("HTTP headers"),
  body: z.string().default("").describe("Request body"),
  contentType: z
    .enum([
      "none",
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "text/plain",
      "text/xml",
      "application/xml",
    ])
    .default("none")
    .describe("Content-Type header"),
  auth: z
    .object({
      type: z
        .enum(["none", "basic", "bearer", "api-key"])
        .default("none")
        .describe("Authentication type"),
      username: z.string().default("").describe("Basic auth username"),
      password: z.string().default("").describe("Basic auth password"),
      token: z.string().default("").describe("Bearer token or API key"),
      headerName: z
        .string()
        .default("X-API-Key")
        .describe("API key header name"),
    })
    .prefault({})
    .describe("Authentication settings"),
  followRedirects: z.boolean().default(true).describe("Follow redirects (-L)"),
  insecure: z.boolean().default(false).describe("Skip SSL verification (-k)"),
  verbose: z.boolean().default(false).describe("Verbose output (-v)"),
  compressed: z
    .boolean()
    .default(false)
    .describe("Request compressed response (--compressed)"),
  maxTime: z
    .number()
    .optional()
    .describe("Maximum time in seconds (--max-time)"),
  proxy: z.string().default("").describe("Proxy URL (-x)"),
  output: z.string().default("").describe("Output file (-o)"),
  includeHeaders: z
    .boolean()
    .default(false)
    .describe("Include response headers (-i)"),
  silent: z.boolean().default(false).describe("Silent mode (-s)"),
});

const outputSchema = z.object({
  command: z.string().describe("Generated cURL command"),
  commandOneLine: z.string().describe("Single-line cURL command"),
  commandParts: z.array(z.string()).describe("Command broken into parts"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function shellEscape(str: string): string {
  // If the string contains no special characters, return as-is
  if (/^[a-zA-Z0-9._\-/:@%+=,]+$/.test(str)) {
    return str;
  }
  // Use single quotes and escape any single quotes inside
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

function execute(input: Input): Output {
  if (!input.url || !input.url.trim()) {
    throw createToolError({
      code: INPUT_INVALID_FORMAT,
      message: "URL is required",
    });
  }

  const parts: string[] = ["curl"];

  // Method (skip for GET as it's default)
  if (input.method !== "GET") {
    parts.push("-X", input.method);
  }

  // URL
  parts.push(shellEscape(input.url.trim()));

  // Content-Type header
  if (input.contentType !== "none") {
    parts.push("-H", shellEscape(`Content-Type: ${input.contentType}`));
  }

  // Custom headers
  for (const header of input.headers) {
    if (header.key) {
      parts.push("-H", shellEscape(`${header.key}: ${header.value}`));
    }
  }

  // Authentication
  if (input.auth) {
    switch (input.auth.type) {
      case "basic":
        if (input.auth.username) {
          parts.push(
            "-u",
            shellEscape(`${input.auth.username}:${input.auth.password}`)
          );
        }
        break;
      case "bearer":
        if (input.auth.token) {
          parts.push(
            "-H",
            shellEscape(`Authorization: Bearer ${input.auth.token}`)
          );
        }
        break;
      case "api-key":
        if (input.auth.token) {
          parts.push(
            "-H",
            shellEscape(`${input.auth.headerName}: ${input.auth.token}`)
          );
        }
        break;
    }
  }

  // Body
  if (input.body) {
    parts.push("-d", shellEscape(input.body));
  }

  // Flags
  if (input.followRedirects) {
    parts.push("-L");
  }
  if (input.insecure) {
    parts.push("-k");
  }
  if (input.verbose) {
    parts.push("-v");
  }
  if (input.compressed) {
    parts.push("--compressed");
  }
  if (input.includeHeaders) {
    parts.push("-i");
  }
  if (input.silent) {
    parts.push("-s");
  }
  if (input.maxTime !== undefined && input.maxTime !== null) {
    parts.push("--max-time", String(input.maxTime));
  }
  if (input.proxy) {
    parts.push("-x", shellEscape(input.proxy));
  }
  if (input.output) {
    parts.push("-o", shellEscape(input.output));
  }

  const commandOneLine = parts.join(" ");

  // Multi-line version for readability
  const multiLineParts: string[] = [];
  let i = 0;
  while (i < parts.length) {
    const part = parts[i]!;
    // Flags that take a value
    if (
      ["-X", "-H", "-u", "-d", "-x", "-o", "--max-time"].includes(part) &&
      i + 1 < parts.length
    ) {
      multiLineParts.push(`  ${part} ${parts[i + 1]!}`);
      i += 2;
    } else if (i === 0) {
      // 'curl' command itself
      multiLineParts.push(part);
      i++;
    } else {
      multiLineParts.push(`  ${part}`);
      i++;
    }
  }

  const command = multiLineParts.join(" \\\n");

  return {
    command,
    commandOneLine,
    commandParts: parts,
  };
}

export const curlBuilder = defineTool({
  meta: {
    id: "network/curl-builder",
    name: "cURL Builder",
    description:
      "Free online cURL command builder — configure URL, method, headers, auth, and body to generate a ready-to-paste cURL command instantly in your browser. No data is stored. Supports basic/bearer/API-key auth, proxies, timeouts, and common flags.",
    category: "network",
    subgroup: "HTTP Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "network",
      "curl",
      "http",
      "request",
      "api",
      "builder",
      "generator",
      "rest",
      "command",
      "post",
      "get",
    ],
    ui: {
      inputLanguage: "plaintext" as const,
      outputRenderer: "code" as const,
    },
    examples: [
      {
        title: "POST JSON to an API endpoint",
        description:
          "Build a cURL command with POST method, JSON body, and Content-Type header",
        input: {
          url: "https://api.example.com/users",
          method: "POST",
          body: '{"name": "John"}',
          contentType: "application/json",
        },
        output:
          '{"command":"curl \\\\\\n  -X POST \\\\\\n  https://api.example.com/users \\\\\\n  -H \'Content-Type: application/json\' \\\\\\n  -d \'{\\"name\\": \\"John\\"}\'  \\\\\\n  -L","commandOneLine":"curl -X POST https://api.example.com/users -H \'Content-Type: application/json\' -d \'{\\"name\\": \\"John\\"}\' -L","commandParts":["curl","-X","POST","https://api.example.com/users","-H","\'Content-Type: application/json\'","-d","\'{\\"name\\": \\"John\\"}\' ","-L"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
