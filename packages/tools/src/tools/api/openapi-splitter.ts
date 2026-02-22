import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("OpenAPI spec in JSON format"),
});

const optionsSchema = z.object({
  splitBy: z
    .enum(["tag", "path"])
    .default("tag")
    .describe("Split by tag or path prefix"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("Split OpenAPI specs as JSON object keyed by group"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let spec: Record<string, unknown>;
  try {
    spec = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  const paths = spec.paths as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!paths) {
    throw new Error("No paths found in spec");
  }

  const splitBy = options?.splitBy ?? "tag";
  const groups: Record<string, Record<string, unknown>> = {};

  for (const [pathKey, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (method === "parameters" || method.startsWith("x-")) continue;

      let groupName: string;

      if (splitBy === "tag") {
        const op = operation as Record<string, unknown>;
        const tags = op.tags as string[] | undefined;
        groupName = tags && tags.length > 0 ? tags[0]! : "untagged";
      } else {
        const parts = pathKey.split("/").filter(Boolean);
        groupName = parts.length > 0 ? parts[0]! : "root";
      }

      if (!groups[groupName]) {
        groups[groupName] = {};
      }
      if (!groups[groupName]![pathKey]) {
        groups[groupName]![pathKey] = {};
      }
      (groups[groupName]![pathKey] as Record<string, unknown>)[method] =
        operation;
    }
  }

  // Build individual specs
  const result: Record<string, unknown> = {};

  for (const [groupName, groupPaths] of Object.entries(groups)) {
    const specInfo = spec.info as Record<string, unknown> | undefined;
    const specTitle =
      typeof specInfo?.title === "string" ? specInfo.title : "API";
    const subSpec: Record<string, unknown> = {
      openapi: spec.openapi ?? "3.0.3",
      info: {
        title: `${specTitle} - ${groupName}`,
        version: specInfo?.version ?? "1.0.0",
      },
      paths: groupPaths,
    };

    if (spec.servers) subSpec.servers = spec.servers;
    if (spec.components) subSpec.components = spec.components;

    result[groupName] = subSpec;
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const openapiSplitter = defineTool({
  meta: {
    id: "api/openapi-splitter",
    name: "OpenAPI Splitter",
    description:
      "Free online OpenAPI splitter — break a large OpenAPI specification into smaller specs grouped by tag or path prefix instantly in your browser. No data is stored. Preserves components, servers, and spec metadata in each split.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "split",
      "separate",
      "tag",
      "swagger",
      "api",
      "microservice",
      "decompose",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Split by Tags",
        description:
          "Split an OpenAPI spec into separate specs grouped by operation tags",
        input:
          '{"openapi":"3.0.3","info":{"title":"API","version":"1.0.0"},"paths":{"/users":{"get":{"tags":["users"],"summary":"List users"}},"/posts":{"get":{"tags":["posts"],"summary":"List posts"}}}}',
        output:
          '{\n  "users": {\n    "openapi": "3.0.3",\n    "info": {\n      "title": "API - users",\n      "version": "1.0.0"\n    },\n    "paths": {\n      "/users": {\n        "get": {\n          "tags": [\n            "users"\n          ],\n          "summary": "List users"\n        }\n      }\n    }\n  },\n  "posts": {\n    "openapi": "3.0.3",\n    "info": {\n      "title": "API - posts",\n      "version": "1.0.0"\n    },\n    "paths": {\n      "/posts": {\n        "get": {\n          "tags": [\n            "posts"\n          ],\n          "summary": "List posts"\n        }\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
