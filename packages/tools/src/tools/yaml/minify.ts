import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("YAML string to minify"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified YAML string"),
  originalSize: z.number().describe("Original size in bytes"),
  minifiedSize: z.number().describe("Minified size in bytes"),
  reduction: z.number().describe("Size reduction percentage"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Minifies YAML by using flow style (JSON-like) output.
 */
function execute(input: Input): Output {
  const originalSize = new TextEncoder().encode(input.input).length;

  try {
    const parsed = yaml.load(input.input);
    // Use flow style for minimal output
    const output = yaml
      .dump(parsed, {
        flowLevel: 0,
        lineWidth: -1,
        noRefs: true,
      })
      .trim();

    const minifiedSize = new TextEncoder().encode(output).length;
    const reduction =
      originalSize > 0
        ? Math.round(((originalSize - minifiedSize) / originalSize) * 100)
        : 0;

    return {
      output,
      originalSize,
      minifiedSize,
      reduction,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid YAML format";
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${message}`,
    });
  }
}

/**
 * YAML Minify tool.
 * Minifies YAML by using flow style.
 */
export const yamlMinify = defineTool({
  meta: {
    id: "yaml/minify",
    name: "YAML Minify",
    description:
      "Free online YAML minifier — compact YAML documents into flow style instantly in your browser. No data is stored. Converts block-style nesting to inline braces and brackets, reducing file size.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "minify",
      "compact",
      "compress",
      "inline",
      "flow-style",
      "reduce",
      "size",
    ],
    examples: [
      {
        title: "Compact a user list config",
        description:
          "Convert block-style YAML with nested arrays to compact flow style — reduces size by ~19%",
        input:
          "users:\n  - name: Alice\n    email: alice@example.com\n    roles:\n      - admin\n      - editor\n  - name: Bob\n    email: bob@example.com\n    roles:\n      - viewer",
        output:
          "{users: [{name: Alice, email: alice@example.com, roles: [admin, editor]}, {name: Bob, email: bob@example.com, roles: [viewer]}]}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
