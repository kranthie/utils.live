import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("Base package.json"),
  input2: z.string().describe("Package.json to merge in"),
});
const outputSchema = z.object({
  original: z.string().describe("Merged package.json"),
  modified: z.string().describe("Merge summary"),
});

function deepMerge(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else if (Array.isArray(value) && Array.isArray(result[key])) {
      result[key] = [
        ...new Set([...(result[key] as unknown[]), ...(value as unknown[])]),
      ];
    } else {
      result[key] = value;
    }
  }
  return result;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let base: Record<string, unknown>, overlay: Record<string, unknown>;
  try {
    base = JSON.parse(input.input1.trim()) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid base package.json");
  }
  try {
    overlay = JSON.parse(input.input2.trim()) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid overlay package.json");
  }

  const merged = deepMerge(base, overlay);
  const added = Object.keys(overlay).filter((k) => !(k in base));
  const updated = Object.keys(overlay).filter((k) => k in base);

  const summary = [
    `# Merge Summary`,
    `Added keys: ${added.join(", ") || "none"}`,
    `Updated keys: ${updated.join(", ") || "none"}`,
  ].join("\n");

  return { original: JSON.stringify(merged, null, 2), modified: summary };
}

export const packageJsonMerger = defineTool({
  meta: {
    id: "code/package-json-merger",
    name: "package.json Merger",
    description:
      "Free online package.json merger — deep merge two package.json files combining dependencies, scripts, and nested objects instantly in your browser. No data is stored. Shows merge summary with added and updated keys.",
    category: "code",
    subgroup: "Package Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "package",
      "json",
      "merge",
      "npm",
      "combine",
      "dependencies",
      "deep merge",
    ],
    examples: [
      {
        title: "Merge two package.json files",
        description: "Deep merge dependencies from two package files",
        input: {
          input1: '{"name":"app","dependencies":{"react":"^18.0.0"}}',
          input2:
            '{"dependencies":{"lodash":"^4.17.0"},"devDependencies":{"vitest":"^1.0.0"}}',
        },
        output:
          '{\n  "original": "{\\n  \\"name\\": \\"app\\",\\n  \\"dependencies\\": {\\n    \\"react\\": \\"^18.0.0\\",\\n    \\"lodash\\": \\"^4.17.0\\"\\n  },\\n  \\"devDependencies\\": {\\n    \\"vitest\\": \\"^1.0.0\\"\\n  }\\n}",\n  "modified": "# Merge Summary\\nAdded keys: devDependencies\\nUpdated keys: dependencies"\n}',
      },
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
