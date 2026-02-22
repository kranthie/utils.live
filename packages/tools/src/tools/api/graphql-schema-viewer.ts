import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("GraphQL schema definition language (SDL)"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted GraphQL schema"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function formatGraphQL(input: string): string {
  const lines = input.split("\n");
  const result: string[] = [];
  let indentLevel = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      continue;
    }

    // Handle closing braces
    if (trimmed === "}" || trimmed.startsWith("}")) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indent = "  ".repeat(indentLevel);

    // Handle comments
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith('"""') ||
      trimmed.startsWith('"')
    ) {
      result.push(`${indent}${trimmed}`);
    } else if (
      trimmed.startsWith("type ") ||
      trimmed.startsWith("input ") ||
      trimmed.startsWith("interface ") ||
      trimmed.startsWith("enum ") ||
      trimmed.startsWith("union ") ||
      trimmed.startsWith("scalar ") ||
      trimmed.startsWith("schema ") ||
      trimmed.startsWith("extend ") ||
      trimmed.startsWith("directive ") ||
      trimmed.startsWith("subscription ")
    ) {
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      result.push(`${indent}${trimmed}`);
    } else {
      result.push(`${indent}${trimmed}`);
    }

    // Handle opening braces
    if (trimmed.endsWith("{")) {
      indentLevel++;
    }
  }

  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }

  return result.join("\n") + "\n";
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const formatted = formatGraphQL(input.input);
  return { output: formatted };
}

export const graphqlSchemaViewer = defineTool({
  meta: {
    id: "api/graphql-schema-viewer",
    name: "GraphQL Schema Viewer",
    description:
      "Free online GraphQL schema viewer — format and display GraphQL SDL definitions with proper indentation instantly in your browser. No data is stored. Handles types, interfaces, enums, unions, and nested field definitions.",
    category: "api",
    subgroup: "GraphQL",
    tier: ToolTier.CLIENT,
    keywords: [
      "graphql",
      "schema",
      "viewer",
      "format",
      "sdl",
      "query",
      "types",
      "display",
    ],
    ui: { inputLanguage: "graphql", outputLanguage: "graphql" },
    examples: [
      {
        title: "Format User and Post Types",
        description:
          "Display formatted GraphQL type definitions with proper indentation",
        input:
          "type User {\n  id: ID!\n  name: String!\n  email: String\n}\n\ntype Post {\n  id: ID!\n  title: String!\n  author: User!\n}",
        output:
          "type User {\n  id: ID!\n  name: String!\n  email: String\n}\n\ntype Post {\n  id: ID!\n  title: String!\n  author: User!\n}\n",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
