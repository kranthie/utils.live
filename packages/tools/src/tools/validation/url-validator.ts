import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({ input: z.string().describe("URL to validate") });
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const urlValidator = defineTool({
  meta: {
    id: "validation/url-validator",
    name: "URL Validator",
    description:
      "Free online URL validator — check if a URL is properly formatted instantly in your browser. No data is stored. Parses and displays the protocol, host, path, query parameters, and fragment.",
    category: "validation",
    subgroup: "Format Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "url",
      "validate",
      "link",
      "format",
      "href",
      "protocol",
      "domain",
      "web",
    ],
    examples: [
      {
        title: "Valid URL",
        description: "Validate a well-formed HTTPS URL with path and query",
        input: "https://api.example.com/v2/users?active=true&page=1",
        output:
          "Valid URL\nProtocol: https:\nHost: api.example.com\nPath: /v2/users\nQuery: ?active=true&page=1",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const url = input.input.trim();
    const errors: string[] = [];
    try {
      const parsed = new URL(url);
      if (!["http:", "https:", "ftp:", "ftps:"].includes(parsed.protocol)) {
        errors.push(`Uncommon protocol: ${parsed.protocol}`);
      }
      const isValid = errors.length === 0;
      const parts = [
        `Protocol: ${parsed.protocol}`,
        `Host: ${parsed.hostname}`,
        parsed.port ? `Port: ${parsed.port}` : null,
        `Path: ${parsed.pathname}`,
        parsed.search ? `Query: ${parsed.search}` : null,
        parsed.hash ? `Hash: ${parsed.hash}` : null,
      ].filter(Boolean);
      return {
        output: isValid
          ? `Valid URL\n${parts.join("\n")}`
          : `URL parsed with warnings: ${errors.join("; ")}`,
        isValid,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch {
      return {
        output: "Invalid URL format",
        isValid: false,
        errors: ["Cannot parse URL"],
      };
    }
  },
});
