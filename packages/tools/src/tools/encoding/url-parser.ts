import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("URL to parse into components"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed URL components as formatted text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    const trimmed = input.input.trim();
    if (!trimmed) {
      throw new Error("URL cannot be empty");
    }

    const url = new URL(trimmed);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const components: Record<string, string> = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || "(default)",
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      host: url.host,
      username: url.username || "(none)",
      password: url.password ? "***" : "(none)",
    };

    const lines: string[] = [];
    lines.push("=== URL Components ===");
    for (const [key, value] of Object.entries(components)) {
      lines.push(`${key}: ${value}`);
    }

    if (Object.keys(params).length > 0) {
      lines.push("");
      lines.push("=== Query Parameters ===");
      for (const [key, value] of Object.entries(params)) {
        lines.push(`${key}: ${value}`);
      }
    }

    return { output: lines.join("\n") };
  } catch (err) {
    if (
      err instanceof TypeError ||
      (err instanceof Error && err.message.includes("Invalid URL"))
    ) {
      throw createToolError({
        code: EXEC_FAILED,
        message: `URL parsing failed: Invalid URL format`,
      });
    }
    const msg = err instanceof Error ? err.message : "Failed to parse URL";
    throw createToolError({
      code: EXEC_FAILED,
      message: `URL parsing failed: ${msg}`,
    });
  }
}

export const urlParser = defineTool({
  meta: {
    id: "encoding/url-parser",
    name: "URL Parser",
    description:
      "Free online URL parser — break down URLs into protocol, host, path, query parameters, and hash components instantly in your browser. No data is stored. Handles complex URLs with authentication, ports, and encoded characters.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["url", "parse", "components", "query", "host", "path"],
    examples: [
      {
        title: "Parse Full URL",
        description: "Break down a URL into its component parts",
        input: "https://api.example.com:8080/v1/users?page=1&limit=10#results",
        output:
          "=== URL Components ===\nprotocol: https:\nhostname: api.example.com\nport: 8080\npathname: /v1/users\nsearch: ?page=1&limit=10\nhash: #results\norigin: https://api.example.com:8080\nhost: api.example.com:8080\nusername: (none)\npassword: (none)\n\n=== Query Parameters ===\npage: 1\nlimit: 10",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
