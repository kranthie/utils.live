import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("GraphQL query or schema to format"),
});

const optionsSchema = z.object({
  indent: z.number().min(1).max(8).default(2).describe("Indentation spaces"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted GraphQL"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");
  const indent = " ".repeat(options?.indent ?? 2);

  let depth = 0;
  let result = "";
  let i = 0;
  let inString = false;

  while (i < text.length) {
    const ch = text[i]!;

    // Handle strings
    if (ch === '"' && (i === 0 || text[i - 1] !== "\\")) {
      inString = !inString;
      result += ch;
      i++;
      continue;
    }

    if (inString) {
      result += ch;
      i++;
      continue;
    }

    // Handle comments
    if (ch === "#") {
      const end = text.indexOf("\n", i);
      const comment = end === -1 ? text.substring(i) : text.substring(i, end);
      result += comment;
      i = end === -1 ? text.length : end;
      continue;
    }

    // Skip whitespace runs
    if (/\s/.test(ch)) {
      // Collapse whitespace
      while (i < text.length && /\s/.test(text[i]!)) i++;
      // Add a single space unless at start of line
      if (
        result.length > 0 &&
        !result.endsWith("\n") &&
        !result.endsWith(indent)
      ) {
        result += " ";
      }
      continue;
    }

    if (ch === "{") {
      result = result.trimEnd() + " {\n";
      depth++;
      result += indent.repeat(depth);
      i++;
      continue;
    }

    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd() + "\n" + indent.repeat(depth) + "}";
      i++;
      // Add newline if next non-whitespace is not }
      let j = i;
      while (j < text.length && /\s/.test(text[j]!)) j++;
      if (j < text.length && text[j]! !== "}") {
        result += "\n" + indent.repeat(depth);
      }
      continue;
    }

    if (ch === "(") {
      result += "(";
      i++;
      continue;
    }

    if (ch === ")") {
      result += ")";
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  // Clean up extra spaces and blank lines
  const output = result
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(
      (line, idx, arr) => !(line === "" && idx > 0 && arr[idx - 1] === "")
    )
    .join("\n")
    .trim();

  return { output };
}

export const graphqlFormatterApi = defineTool({
  meta: {
    id: "api/graphql-formatter-api",
    name: "GraphQL Formatter",
    description:
      "Free online GraphQL formatter — prettify and indent GraphQL queries and schema definitions instantly in your browser. No data is stored. Formats nested fields, arguments, and type definitions with configurable indentation.",
    category: "api",
    subgroup: "GraphQL",
    tier: ToolTier.CLIENT,
    keywords: [
      "graphql",
      "format",
      "prettify",
      "query",
      "schema",
      "indent",
      "gql",
      "api",
    ],
    ui: { inputLanguage: "graphql", outputLanguage: "graphql" },
    examples: [
      {
        title: "Format Nested Query",
        description: "Prettify a minified GraphQL query with nested fields",
        input: "query { users { id name email posts { title createdAt } } }",
        output:
          "query {\n  users {\n    id name email posts {\n      title createdAt\n    }\n  }\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
