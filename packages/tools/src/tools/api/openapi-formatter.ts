import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted OpenAPI spec"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let spec: unknown;
  try {
    spec = JSON.parse(input.input);
  } catch {
    throw new Error("Invalid JSON: Could not parse the input");
  }

  return { output: JSON.stringify(spec, null, 2) };
}

export const openapiFormatter = defineTool({
  meta: {
    id: "api/openapi-formatter",
    name: "OpenAPI Formatter",
    description:
      "Free online OpenAPI formatter — pretty-print and format OpenAPI specification JSON with consistent 2-space indentation instantly in your browser. No data is stored. Validates JSON syntax and outputs cleanly formatted specs.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "format",
      "pretty-print",
      "swagger",
      "api",
      "json",
      "indent",
      "beautify",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Format Minified OpenAPI Spec",
        description:
          "Pretty-print a minified OpenAPI 3.0 spec with proper indentation",
        input:
          '{"openapi":"3.0.3","info":{"title":"Pet Store","version":"1.0.0"},"paths":{"/pets":{"get":{"summary":"List pets","responses":{"200":{"description":"OK"}}}}}}',
        output:
          '{\n  "openapi": "3.0.3",\n  "info": {\n    "title": "Pet Store",\n    "version": "1.0.0"\n  },\n  "paths": {\n    "/pets": {\n      "get": {\n        "summary": "List pets",\n        "responses": {\n          "200": {\n            "description": "OK"\n          }\n        }\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
