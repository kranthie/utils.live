import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("GraphQL query to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted GraphQL query"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(2)
    .describe("Spaces per indent level"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const indentSize = options?.indent ?? 2;
  const indentStr = " ".repeat(indentSize);
  const lines: string[] = [];
  let level = 0;

  let normalized = raw.replace(/\s+/g, " ");
  normalized = normalized.replace(/\{/g, " {\n");
  normalized = normalized.replace(/\}/g, "\n}\n");

  const rawLines = normalized.split("\n");

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed === "}") {
      level = Math.max(0, level - 1);
    }

    lines.push(indentStr.repeat(level) + trimmed);

    if (trimmed.endsWith("{")) {
      level++;
    }
  }

  return { output: lines.join("\n") };
}

export const graphqlFormatter = defineTool({
  meta: {
    id: "code/graphql-formatter",
    name: "GraphQL Formatter",
    description:
      "Free online GraphQL formatter — format and pretty-print GraphQL queries with proper indentation instantly in your browser. No data is stored. Supports configurable indent size for queries, mutations, and fragments.",
    category: "code",
    subgroup: "Formatters",
    tier: ToolTier.CLIENT,
    keywords: ["graphql", "format", "prettify", "query", "indent"],
    examples: [
      {
        title: "Format a GraphQL query",
        description: "Add proper indentation to a compressed GraphQL query",
        input: "query { user(id: 1) { name email posts { title } } }",
        output:
          "query  {\n  user(id: 1)  {\n    name email posts  {\n      title\n    }\n  }\n}",
      },
    ],
    ui: {
      inputLanguage: "plaintext",
      outputLanguage: "plaintext",
    },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
