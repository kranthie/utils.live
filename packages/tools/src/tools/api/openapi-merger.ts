import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First OpenAPI spec (JSON)"),
  input2: z.string().describe("Second OpenAPI spec (JSON)"),
});

const outputSchema = z.object({
  original: z.string().describe("First spec info"),
  modified: z.string().describe("Second spec info"),
  output: z.string().describe("Merged OpenAPI spec in JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      result[key] !== null &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else if (Array.isArray(value) && Array.isArray(result[key])) {
      const existing = result[key] as unknown[];
      const merged = [...existing];
      for (const item of value) {
        const exists = existing.some(
          (e) => JSON.stringify(e) === JSON.stringify(item)
        );
        if (!exists) merged.push(item);
      }
      result[key] = merged;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getSpecInfo(spec: Record<string, unknown>): string {
  const info = spec.info as Record<string, unknown> | undefined;
  const title = typeof info?.title === "string" ? info.title : "Untitled";
  const version = typeof info?.version === "string" ? info.version : "unknown";
  const pathCount = spec.paths
    ? Object.keys(spec.paths as Record<string, unknown>).length
    : 0;
  return `${title} v${version} (${pathCount} paths)`;
}

function execute(input: Input): Output {
  if (!input.input1.trim() || !input.input2.trim()) {
    throw new Error("Both inputs are required");
  }

  let spec1: Record<string, unknown>;
  let spec2: Record<string, unknown>;

  try {
    spec1 = JSON.parse(input.input1) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in first input");
  }

  try {
    spec2 = JSON.parse(input.input2) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in second input");
  }

  const merged: Record<string, unknown> = {
    openapi: spec1.openapi ?? spec2.openapi ?? "3.0.3",
  };

  // Merge info (prefer first spec)
  const info1 = (spec1.info ?? {}) as Record<string, unknown>;
  const info2 = (spec2.info ?? {}) as Record<string, unknown>;
  const info1Title = typeof info1.title === "string" ? info1.title : "API";
  const info2Title = typeof info2.title === "string" ? info2.title : "API";
  merged.info = {
    title: `${info1Title} + ${info2Title}`,
    version: info1.version ?? info2.version ?? "1.0.0",
    description: [info1.description, info2.description]
      .filter(Boolean)
      .join("\n\n"),
  };

  // Merge servers
  const servers1 = (spec1.servers ?? []) as unknown[];
  const servers2 = (spec2.servers ?? []) as unknown[];
  if (servers1.length > 0 || servers2.length > 0) {
    const allServers = [...servers1];
    for (const s of servers2) {
      const exists = allServers.some(
        (e) => JSON.stringify(e) === JSON.stringify(s)
      );
      if (!exists) allServers.push(s);
    }
    merged.servers = allServers;
  }

  // Merge paths
  const paths1 = (spec1.paths ?? {}) as Record<string, unknown>;
  const paths2 = (spec2.paths ?? {}) as Record<string, unknown>;
  merged.paths = deepMerge(paths1, paths2);

  // Merge components
  const comp1 = (spec1.components ?? {}) as Record<string, unknown>;
  const comp2 = (spec2.components ?? {}) as Record<string, unknown>;
  if (Object.keys(comp1).length > 0 || Object.keys(comp2).length > 0) {
    merged.components = deepMerge(comp1, comp2);
  }

  // Merge tags
  const tags1 = (spec1.tags ?? []) as Array<Record<string, unknown>>;
  const tags2 = (spec2.tags ?? []) as Array<Record<string, unknown>>;
  if (tags1.length > 0 || tags2.length > 0) {
    const allTags = [...tags1];
    for (const tag of tags2) {
      if (!allTags.some((t) => t.name === tag.name)) {
        allTags.push(tag);
      }
    }
    merged.tags = allTags;
  }

  // Merge security
  if (spec1.security || spec2.security) {
    const sec1 = (spec1.security ?? []) as unknown[];
    const sec2 = (spec2.security ?? []) as unknown[];
    const allSec = [...sec1];
    for (const s of sec2) {
      if (!allSec.some((e) => JSON.stringify(e) === JSON.stringify(s))) {
        allSec.push(s);
      }
    }
    merged.security = allSec;
  }

  return {
    original: getSpecInfo(spec1),
    modified: getSpecInfo(spec2),
    output: JSON.stringify(merged, null, 2),
  };
}

export const openapiMerger = defineTool({
  meta: {
    id: "api/openapi-merger",
    name: "OpenAPI Merger",
    description:
      "Free online OpenAPI merger — combine two OpenAPI specifications into a single unified spec instantly in your browser. No data is stored. Merges paths, schemas, servers, tags, and security definitions with deduplication.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "openapi",
      "merge",
      "combine",
      "swagger",
      "api",
      "consolidate",
      "join",
      "spec",
    ],
    ui: { outputLanguage: "json" },
    examples: [
      {
        title: "Merge Users and Posts APIs",
        description:
          "Combine two separate OpenAPI specs into a single unified specification",
        input: {
          input1:
            '{"openapi":"3.0.3","info":{"title":"Users API","version":"1.0.0"},"paths":{"/users":{"get":{"summary":"List users"}}}}',
          input2:
            '{"openapi":"3.0.3","info":{"title":"Posts API","version":"1.0.0"},"paths":{"/posts":{"get":{"summary":"List posts"}}}}',
        },
        output:
          '{\n  "openapi": "3.0.3",\n  "info": {\n    "title": "Users API + Posts API",\n    "version": "1.0.0",\n    "description": ""\n  },\n  "paths": {\n    "/users": {\n      "get": {\n        "summary": "List users"\n      }\n    },\n    "/posts": {\n      "get": {\n        "summary": "List posts"\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
