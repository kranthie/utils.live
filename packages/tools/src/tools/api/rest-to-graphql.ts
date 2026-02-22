import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe(
      "REST API endpoint descriptions (JSON format with endpoints array)"
    ),
});

const outputSchema = z.object({
  output: z.string().describe("Suggested GraphQL schema"),
});

interface RestEndpoint {
  method: string;
  path: string;
  description?: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
}

function inferGraphqlType(value: unknown): string {
  if (value === null || value === undefined) return "String";
  if (typeof value === "string") return "String";
  if (typeof value === "number")
    return Number.isInteger(value) ? "Int" : "Float";
  if (typeof value === "boolean") return "Boolean";
  if (Array.isArray(value)) {
    if (value.length > 0) return `[${inferGraphqlType(value[0])}]`;
    return "[String]";
  }
  return "JSON";
}

function extractResourceName(path: string): string {
  const segments = path
    .split("/")
    .filter((s) => s && !s.startsWith(":") && !s.startsWith("{"));
  const last = segments[segments.length - 1] ?? "Resource";
  // Capitalize and singularize simple cases
  const name = last.charAt(0).toUpperCase() + last.slice(1);
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}

function objectToFields(
  obj: Record<string, unknown>,
  indent: string
): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      lines.push(`${indent}${key}: ${extractResourceName(key)}`);
    } else {
      lines.push(`${indent}${key}: ${inferGraphqlType(value)}`);
    }
  }
  return lines;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  let endpoints: RestEndpoint[];
  try {
    const parsed: unknown = JSON.parse(text);
    endpoints = Array.isArray(parsed)
      ? (parsed as RestEndpoint[])
      : (((parsed as Record<string, unknown>).endpoints as RestEndpoint[]) ?? [
          parsed as RestEndpoint,
        ]);
  } catch {
    throw new Error("Input must be valid JSON describing REST endpoints");
  }

  if (endpoints.length === 0) throw new Error("No endpoints found in input");

  const types = new Map<string, string[]>();
  const queries: string[] = [];
  const mutations: string[] = [];
  const inputs: string[] = [];

  for (const ep of endpoints) {
    const resource = extractResourceName(ep.path);
    const method = (ep.method ?? "GET").toUpperCase();

    // Build type from response
    if (ep.responseBody && typeof ep.responseBody === "object") {
      if (!types.has(resource)) {
        const fields = objectToFields(ep.responseBody, "  ");
        types.set(resource, fields);
      }
    }

    // Build queries and mutations
    const hasId = ep.path.includes(":id") || ep.path.includes("{id}");
    const desc = ep.description ? ` # ${ep.description}` : "";

    if (method === "GET") {
      if (hasId) {
        queries.push(
          `  ${resource.toLowerCase()}(id: ID!): ${resource}${desc}`
        );
      } else {
        queries.push(
          `  ${resource.toLowerCase()}s(limit: Int, offset: Int): [${resource}!]!${desc}`
        );
      }
    } else if (method === "POST") {
      const inputName = `Create${resource}Input`;
      mutations.push(
        `  create${resource}(input: ${inputName}!): ${resource}!${desc}`
      );
      if (ep.requestBody && typeof ep.requestBody === "object") {
        const fields = objectToFields(ep.requestBody, "  ");
        inputs.push(`input ${inputName} {\n${fields.join("\n")}\n}`);
      }
    } else if (method === "PUT" || method === "PATCH") {
      const inputName = `Update${resource}Input`;
      mutations.push(
        `  update${resource}(id: ID!, input: ${inputName}!): ${resource}!${desc}`
      );
      if (ep.requestBody && typeof ep.requestBody === "object") {
        const fields = objectToFields(ep.requestBody, "  ");
        inputs.push(`input ${inputName} {\n${fields.join("\n")}\n}`);
      }
    } else if (method === "DELETE") {
      mutations.push(`  delete${resource}(id: ID!): Boolean!${desc}`);
    }
  }

  const lines: string[] = [
    "# Generated GraphQL Schema from REST endpoints",
    "",
  ];

  // Types
  for (const [name, fields] of types.entries()) {
    lines.push(`type ${name} {`);
    lines.push(fields.join("\n"));
    lines.push("}");
    lines.push("");
  }

  // Input types
  for (const inp of inputs) {
    lines.push(inp);
    lines.push("");
  }

  // Query type
  if (queries.length > 0) {
    lines.push("type Query {");
    lines.push(queries.join("\n"));
    lines.push("}");
    lines.push("");
  }

  // Mutation type
  if (mutations.length > 0) {
    lines.push("type Mutation {");
    lines.push(mutations.join("\n"));
    lines.push("}");
    lines.push("");
  }

  return { output: lines.join("\n").trimEnd() };
}

export const restToGraphql = defineTool({
  meta: {
    id: "api/rest-to-graphql",
    name: "REST to GraphQL",
    description:
      "Free online REST to GraphQL converter — generate GraphQL schema definitions from REST API endpoint descriptions instantly in your browser. No data is stored. Infers types, queries, mutations, and input types from HTTP methods and response shapes.",
    category: "api",
    subgroup: "GraphQL",
    tier: ToolTier.CLIENT,
    keywords: [
      "rest",
      "graphql",
      "schema",
      "api",
      "convert",
      "migrate",
      "query",
      "mutation",
    ],
    ui: { inputLanguage: "json", outputLanguage: "graphql" },
    examples: [
      {
        title: "Convert User CRUD Endpoints",
        description:
          "Generate GraphQL schema from REST endpoints for listing and creating users",
        input:
          '[{"method":"GET","path":"/users","description":"List users","responseBody":{"id":1,"name":"Alice","email":"alice@example.com"}},{"method":"POST","path":"/users","description":"Create user","requestBody":{"name":"Alice","email":"alice@example.com"}}]',
        output:
          "# Generated GraphQL Schema from REST endpoints\n\ntype User {\n  id: Int\n  name: String\n  email: String\n}\n\ninput CreateUserInput {\n  name: String\n  email: String\n}\n\ntype Query {\n  users(limit: Int, offset: Int): [User!]! # List users\n}\n\ntype Mutation {\n  createUser(input: CreateUserInput!): User! # Create user\n}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
