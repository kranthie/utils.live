import { z } from "zod";
import yaml from "js-yaml";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { YAML_PARSE_ERROR } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Multi-document YAML string to split"),
});

const optionsSchema = z.object({
  outputFormat: z
    .enum(["yaml", "json"])
    .default("yaml")
    .describe("Output format for each document"),
  indent: z
    .number()
    .min(1)
    .max(8)
    .default(2)
    .describe("Indentation for output"),
});

const outputSchema = z.object({
  documents: z.array(z.string()).describe("Array of individual documents"),
  count: z.number().describe("Number of documents found"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Splits a multi-document YAML string into individual documents.
 */
function execute(input: Input, options?: Options): Output {
  const outputFormat = options?.outputFormat ?? "yaml";
  const indent = options?.indent ?? 2;

  const documents: unknown[] = [];

  try {
    yaml.loadAll(input.input, (doc) => {
      documents.push(doc);
    });
  } catch (err) {
    throw createToolError({
      code: YAML_PARSE_ERROR,
      message: `Invalid YAML: ${err instanceof Error ? err.message : "Parse error"}`,
    });
  }

  const formattedDocuments = documents.map((doc) => {
    if (outputFormat === "json") {
      return JSON.stringify(doc, null, indent);
    }
    return yaml.dump(doc, { indent });
  });

  return {
    documents: formattedDocuments,
    count: documents.length,
  };
}

/**
 * YAML Splitter tool.
 * Splits a multi-document YAML file into individual documents.
 */
export const yamlSplitter = defineTool({
  meta: {
    id: "yaml/splitter",
    name: "YAML Splitter",
    description:
      "Free online YAML splitter — split multi-document YAML files into individual documents instantly in your browser. No data is stored. Handles Kubernetes manifests, CI/CD configs, and any YAML with --- separators.",
    category: "yaml",
    tier: ToolTier.CLIENT,
    keywords: [
      "yaml",
      "split",
      "multi-document",
      "separate",
      "kubernetes",
      "k8s",
      "manifest",
      "triple-dash",
    ],
    examples: [
      {
        title: "Split Kubernetes Service + Deployment",
        description:
          "Split a multi-document K8s manifest file into individual YAML documents",
        input:
          "---\napiVersion: v1\nkind: Service\nmetadata:\n  name: web\nspec:\n  ports:\n    - port: 80\n---\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web\nspec:\n  replicas: 2",
        output:
          '{"documents":["apiVersion: v1\\nkind: Service\\nmetadata:\\n  name: web\\nspec:\\n  ports:\\n    - port: 80\\n","apiVersion: apps/v1\\nkind: Deployment\\nmetadata:\\n  name: web\\nspec:\\n  replicas: 2\\n"],"count":2}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
