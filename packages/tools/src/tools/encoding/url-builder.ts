import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  protocol: z
    .string()
    .default("https")
    .describe("URL protocol (e.g., https, http)"),
  hostname: z
    .string()
    .default("example.com")
    .describe("Hostname (e.g., example.com)"),
  port: z
    .string()
    .default("")
    .describe("Port number (leave empty for default)"),
  pathname: z.string().default("/").describe("URL path (e.g., /api/v1/users)"),
  query: z
    .string()
    .default("")
    .describe("Query string without ? (e.g., key=value&foo=bar)"),
  hash: z
    .string()
    .default("")
    .describe("Fragment/hash without # (e.g., section1)"),
});

const outputSchema = z.object({
  output: z.string().describe("Constructed URL"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    const protocol = input.protocol.replace(/:?\/*$/, "");
    const hostname = input.hostname.trim();
    if (!hostname) {
      throw new Error("Hostname is required");
    }

    let url = `${protocol}://${hostname}`;

    if (input.port) {
      url += `:${input.port}`;
    }

    let pathname = input.pathname;
    if (pathname && !pathname.startsWith("/")) {
      pathname = "/" + pathname;
    }
    url += pathname || "/";

    if (input.query) {
      const query = input.query.startsWith("?")
        ? input.query.substring(1)
        : input.query;
      url += `?${query}`;
    }

    if (input.hash) {
      const hash = input.hash.startsWith("#")
        ? input.hash.substring(1)
        : input.hash;
      url += `#${hash}`;
    }

    // Validate by parsing
    new URL(url);

    return { output: url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to build URL";
    throw createToolError({
      code: EXEC_FAILED,
      message: `URL building failed: ${msg}`,
    });
  }
}

export const urlBuilder = defineTool({
  meta: {
    id: "encoding/url-builder",
    name: "URL Builder",
    description:
      "Free online URL builder — construct URLs from individual components like protocol, host, path, query, and hash instantly in your browser. No data is stored. Validates the resulting URL and handles port numbers, query strings, and fragment identifiers.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["url", "build", "construct", "generator", "components"],
    examples: [
      {
        title: "Build API URL",
        description: "Construct a URL from individual components",
        input: {
          protocol: "https",
          hostname: "api.example.com",
          port: "",
          pathname: "/v1/users",
          query: "page=1&limit=10",
          hash: "",
        },
        output: "https://api.example.com/v1/users?page=1&limit=10",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
