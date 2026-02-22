import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { JSONC_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("JSONC (JSON with Comments) string to process"),
});

const outputSchema = z.object({
  output: z.string().describe("Valid JSON string with comments stripped"),
  commentsRemoved: z.number().describe("Number of comments removed"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Strips comments from JSONC (JSON with Comments) to produce valid JSON.
 * Handles:
 * - Single-line comments (//)
 * - Multi-line comments (/* *\/)
 * - Trailing commas
 */
function execute(input: Input): Output {
  try {
    const result = input.input;
    let commentsRemoved = 0;

    // Track whether we're inside a string to avoid removing comment-like content in strings
    let inString = false;
    let stringChar = "";
    let output = "";
    let i = 0;

    while (i < result.length) {
      const char = result[i];
      const nextChar = result[i + 1];

      // Handle string boundaries
      if (
        (char === '"' || char === "'") &&
        (i === 0 || result[i - 1] !== "\\")
      ) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = "";
        }
        output += char;
        i++;
        continue;
      }

      // Skip comments only when not in a string
      if (!inString) {
        // Single-line comment
        if (char === "/" && nextChar === "/") {
          commentsRemoved++;
          // Skip until end of line
          while (i < result.length && result[i] !== "\n") {
            i++;
          }
          continue;
        }

        // Multi-line comment
        if (char === "/" && nextChar === "*") {
          commentsRemoved++;
          i += 2; // Skip /*
          // Skip until */
          while (i < result.length - 1) {
            if (result[i] === "*" && result[i + 1] === "/") {
              i += 2; // Skip */
              break;
            }
            i++;
          }
          continue;
        }
      }

      output += char;
      i++;
    }

    // Remove trailing commas (before ] or })
    output = output.replace(/,(\s*[}\]])/g, "$1");

    // Validate that the result is valid JSON
    try {
      JSON.parse(output);
    } catch {
      throw new Error("Result is not valid JSON after stripping comments");
    }

    return {
      output,
      commentsRemoved,
    };
  } catch (err) {
    throw createToolError({
      code: JSONC_PARSE_ERROR,
      message: `Failed to strip JSONC comments: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

/**
 * JSONC Stripper tool.
 * Strips comments from JSONC (JSON with Comments) to get valid JSON.
 */
export const jsoncStripper = defineTool({
  meta: {
    id: "data/jsonc-stripper",
    name: "JSONC Stripper",
    description:
      "Free online JSONC comment stripper — remove comments from JSON with Comments (JSONC) to get valid JSON instantly in your browser. No data is stored. Strips single-line (//) and multi-line (/* */) comments, and removes trailing commas.",
    category: "data",
    tier: ToolTier.CLIENT,
    keywords: [
      "jsonc",
      "json",
      "comments",
      "strip",
      "remove",
      "clean",
      "vscode",
      "tsconfig",
    ],
    examples: [
      {
        title: "Server config with inline and block comments",
        description: "Remove comments from a JSONC file to produce valid JSON",
        input:
          '{\n  // Server config\n  "host": "localhost",\n  "port": 3000 /* default port */\n}',
        output: '{\n  \n  "host": "localhost",\n  "port": 3000 \n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
