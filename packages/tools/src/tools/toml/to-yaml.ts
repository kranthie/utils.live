import { z } from "zod";
import TOML from "@iarna/toml";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { TOML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("TOML string to convert to YAML"),
});

const outputSchema = z.object({
  output: z.string().describe("YAML string"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("YAML indentation spaces"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Converts TOML to YAML format.
 */
function execute(input: Input, options?: Options): Output {
  const indent = options?.indent ?? 2;

  try {
    const parsed = TOML.parse(input.input);
    const output = yaml.dump(parsed, {
      indent,
      noRefs: true,
    });

    return { output };
  } catch (err) {
    throw createToolError({
      code: TOML_PARSE_ERROR,
      message: `Invalid TOML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }
}

/**
 * TOML to YAML tool.
 * Converts TOML to YAML format.
 */
export const tomlToYaml = defineTool({
  meta: {
    id: "toml/to-yaml",
    name: "TOML to YAML",
    description:
      "Free online TOML to YAML converter — paste your TOML config and get YAML output instantly in your browser. No data is stored. Handles nested tables, arrays of tables, and inline tables with proper indentation.",
    category: "toml",
    tier: ToolTier.CLIENT,
    keywords: [
      "toml",
      "yaml",
      "convert",
      "transform",
      "config",
      "configuration",
      "cargo",
      "pyproject",
      "parser",
    ],
    examples: [
      {
        title: "pyproject.toml tool settings",
        description:
          "Convert Python pyproject.toml tool configuration sections to YAML",
        input:
          '[tool.pytest.ini_options]\nminversion = "6.0"\naddopts = ["-ra", "-q", "--strict-markers"]\ntestpaths = ["tests", "integration"]\n\n[tool.black]\nline-length = 88\ntarget-version = ["py39", "py310", "py311"]',
        output:
          "tool:\n  pytest:\n    ini_options:\n      minversion: '6.0'\n      addopts:\n        - '-ra'\n        - '-q'\n        - '--strict-markers'\n      testpaths:\n        - tests\n        - integration\n  black:\n    line-length: 88\n    target-version:\n      - py39\n      - py310\n      - py311\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
