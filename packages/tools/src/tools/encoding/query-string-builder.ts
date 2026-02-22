import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "Key-value pairs, one per line (format: key=value or key: value)"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("Built query string"),
});

const optionsSchema = z.object({
  includeQuestion: z
    .boolean()
    .default(true)
    .describe("Include leading ? in the output"),
  encode: z.boolean().default(true).describe("URL-encode the values"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const includeQuestion = options?.includeQuestion ?? true;
  const encode = options?.encode ?? true;

  try {
    const lines = input.input
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new Error("No key-value pairs provided");
    }

    const params = new URLSearchParams();

    for (const line of lines) {
      // Try splitting by = first, then by :
      let key: string;
      let value: string;
      const eqIndex = line.indexOf("=");
      const colonIndex = line.indexOf(":");

      if (eqIndex >= 0 && (colonIndex < 0 || eqIndex < colonIndex)) {
        key = line.substring(0, eqIndex).trim();
        value = line.substring(eqIndex + 1).trim();
      } else if (colonIndex >= 0) {
        key = line.substring(0, colonIndex).trim();
        value = line.substring(colonIndex + 1).trim();
      } else {
        key = line.trim();
        value = "";
      }

      if (!key) continue;

      params.append(key, value);
    }

    let result = params.toString();
    if (!encode) {
      result = decodeURIComponent(result);
    }

    if (includeQuestion && result) {
      result = "?" + result;
    }

    return { output: result };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to build query string";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Query string building failed: ${msg}`,
    });
  }
}

export const queryStringBuilder = defineTool({
  meta: {
    id: "encoding/query-string-builder",
    name: "Query String Builder",
    description:
      "Free online query string builder — construct URL query strings from key-value pairs instantly in your browser. No data is stored. Accepts key=value or key: value format, supports URL encoding, and adds optional leading ? prefix.",
    category: "encoding",
    subgroup: "URL Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["query", "string", "build", "generator", "url", "parameters"],
    examples: [
      {
        title: "Build Query String",
        description: "Build a URL query string from key-value pairs",
        input: "page=1\nlimit=20\nsort=name",
        output: "?page=1&limit=20&sort=name",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
