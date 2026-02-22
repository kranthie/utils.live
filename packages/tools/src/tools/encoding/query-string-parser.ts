import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe("Query string to parse (with or without leading ?)"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed key-value pairs, one per line"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    let qs = input.input.trim();
    if (!qs) {
      throw new Error("Query string cannot be empty");
    }

    // Remove leading ? if present
    if (qs.startsWith("?")) {
      qs = qs.substring(1);
    }

    // Also handle full URLs by extracting query part
    if (qs.includes("://")) {
      try {
        const url = new URL(qs);
        qs = url.search.substring(1); // Remove leading ?
      } catch {
        // Not a valid URL, treat as raw query string
      }
    }

    if (!qs) {
      throw new Error("No query parameters found");
    }

    const params = new URLSearchParams(qs);
    const lines: string[] = [];
    params.forEach((value, key) => {
      lines.push(`${key} = ${value}`);
    });

    if (lines.length === 0) {
      throw new Error("No valid query parameters found");
    }

    return { output: lines.join("\n") };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to parse query string";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Query string parsing failed: ${msg}`,
    });
  }
}

export const queryStringParser = defineTool({
  meta: {
    id: "encoding/query-string-parser",
    name: "Query String Parser",
    description:
      "Free online query string parser — break down URL query strings into individual key-value pairs instantly in your browser. No data is stored. Handles leading ? prefix, full URLs, and percent-encoded parameters.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["query", "string", "parse", "url", "parameters", "key-value"],
    examples: [
      {
        title: "Parse Query String",
        description: "Parse a URL query string into individual key-value pairs",
        input: "?page=1&limit=20&sort=name",
        output: "page = 1\nlimit = 20\nsort = name",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
