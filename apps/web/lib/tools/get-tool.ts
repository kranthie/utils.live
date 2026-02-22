import {
  getToolById,
  getToolsByCategory,
  getAllTools,
  ToolTier,
  getCategoryById,
} from "@utils-live/tools";
import type { Tool, ToolMeta, ToolExample } from "@utils-live/tools";
import { getToolUIConfig } from "@utils-live/tools";
import type { ToolUIConfig } from "@utils-live/tools";
import { toJSONSchema } from "zod";
import type { ZodType } from "zod";
import { cache } from "react";

// Re-export ToolTier for use by other modules
export { ToolTier };

/**
 * Tool data for page rendering.
 */
export interface ToolPageData {
  meta: ToolMeta;
  ui: ToolUIConfig;
  inputSchema: Record<string, unknown>;
  optionsSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  examples: ToolExample[];
}

/**
 * Tool card data for grid displays.
 */
export interface ToolCardData {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: ToolTier;
  icon: string;
  href: string;
  subgroup?: string;
}

/**
 * Category summary data.
 */
export interface CategorySummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  toolCount: number;
  href: string;
  group?: string;
}

/**
 * Get a tool by category and tool slug.
 * Cached for server component usage.
 */
export const getTool = cache(
  (category: string, toolSlug: string): ToolPageData | null => {
    const toolId = `${category}/${toolSlug}`;
    const tool = getToolById(toolId);

    if (!tool) {
      return null;
    }

    const ui = getToolUIConfig(tool.meta);

    return {
      meta: tool.meta,
      ui,
      inputSchema: tool.inputSchema ? convertSchema(tool.inputSchema) : {},
      optionsSchema: tool.optionsSchema
        ? convertSchema(tool.optionsSchema)
        : {},
      outputSchema: tool.outputSchema ? convertSchema(tool.outputSchema) : {},
      examples: tool.meta.examples ?? [],
    };
  }
);

/**
 * Get all tools in a category.
 * Cached for server component usage.
 */
export const getToolsInCategory = cache((category: string): ToolCardData[] => {
  const tools = getToolsByCategory(category);

  return tools.map((tool) => toolToCardData(tool));
});

/**
 * Get all tools.
 * Cached for server component usage.
 */
export const getAllToolCards = cache((): ToolCardData[] => {
  const tools = getAllTools();
  return tools.map((tool) => toolToCardData(tool));
});

/**
 * Get the total tool count. Use this everywhere instead of hardcoding numbers.
 * Cached for server component usage.
 */
export const getToolCount = cache((): number => {
  return getAllTools().length;
});

/**
 * Get the tool count rounded down to the nearest 50 for marketing use.
 */
export function getRoundedToolCount(): number {
  return Math.floor(getToolCount() / 50) * 50;
}

/**
 * Get a human-readable tool count label like "150+".
 * Rounds down to nearest 50 for a clean marketing number.
 */
export function getToolCountLabel(): string {
  return `${getRoundedToolCount()}+`;
}

/**
 * Get related tools for a given tool.
 */
export const getRelatedTools = cache(
  (toolId: string, limit = 6): ToolCardData[] => {
    const tool = getToolById(toolId);
    if (!tool) return [];

    // Get tools in same category, excluding current tool
    const categoryTools = getToolsByCategory(tool.meta.category)
      .filter((t) => t.meta.id !== toolId)
      .slice(0, limit);

    return categoryTools.map((t) => toolToCardData(t));
  }
);

/**
 * Get all category summaries.
 */
export const getCategorySummaries = cache((): CategorySummary[] => {
  const tools = getAllTools();
  const categoryMap = new Map<string, { count: number; tools: Tool[] }>();

  // Group tools by category
  for (const tool of tools) {
    const category = tool.meta.category;
    const existing = categoryMap.get(category);
    if (existing) {
      existing.count++;
      existing.tools.push(tool);
    } else {
      categoryMap.set(category, { count: 1, tools: [tool] });
    }
  }

  // Convert to summaries, sorted by category order
  return Array.from(categoryMap.entries())
    .map(([id, data]) => ({
      id,
      name: formatCategoryName(id),
      description: getCategoryDescription(id),
      icon: getDefaultIcon(id),
      toolCount: data.count,
      href: `/tools/${id}`,
      group: getCategoryById(id)?.group,
      _order: getCategoryById(id)?.order ?? 999,
    }))
    .sort((a, b) => a._order - b._order)
    .map(({ _order: _, ...rest }) => rest);
});

/**
 * Get category info by ID.
 */
export const getCategoryInfo = cache(
  (categoryId: string): CategorySummary | null => {
    const summaries = getCategorySummaries();
    return summaries.find((s) => s.id === categoryId) ?? null;
  }
);

/**
 * Convert a Tool to ToolCardData.
 */
function toolToCardData(tool: Tool): ToolCardData {
  const parts = tool.meta.id.split("/");
  const category = parts[0] ?? tool.meta.category;
  const slug = parts[1] ?? tool.meta.id;
  return {
    id: tool.meta.id,
    name: tool.meta.name,
    description: tool.meta.description,
    category: tool.meta.category,
    tier: tool.meta.tier,
    icon: tool.meta.icon ?? getDefaultIcon(tool.meta.category),
    href: `/tools/${category}/${slug}`,
    subgroup: tool.meta.subgroup,
  };
}

/**
 * Format category ID to display name.
 * Uses canonical category data from @utils-live/tools.
 */
function formatCategoryName(categoryId: string): string {
  const category = getCategoryById(categoryId);
  if (category) {
    return category.name;
  }
  return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
}

/**
 * Get category description.
 * Uses canonical category data from @utils-live/tools.
 */
function getCategoryDescription(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.description ?? `Tools for ${categoryId}`;
}

/**
 * Get default icon for a category.
 * Uses the Lucide icon name from canonical category data.
 */
function getDefaultIcon(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.icon ?? "Wrench";
}

/**
 * Convert a Zod schema to a JSON Schema object suitable for UI rendering.
 * Uses Zod v4's built-in toJSONSchema for native conversion, then adds
 * human-readable titles to object properties for form labels.
 */
function convertSchema(schema: ZodType): Record<string, unknown> {
  try {
    const rawSchema = toJSONSchema(schema) as Record<string, unknown>;

    // Serialize to plain object — toJSONSchema may return objects with
    // non-serializable properties (classes/methods) that Next.js rejects
    // when passing from Server Components to Client Components.
    const jsonSchema = JSON.parse(JSON.stringify(rawSchema)) as Record<
      string,
      unknown
    >;

    // Remove the $schema key since we don't need it for UI rendering
    delete jsonSchema.$schema;

    // Add human-readable titles to object properties for form labels
    addPropertyTitles(jsonSchema);

    return jsonSchema;
  } catch (err) {
    console.error("[convertSchema] Failed to convert schema:", err);
    return {};
  }
}

/**
 * Add auto-generated titles to object properties for UI form labels.
 * Converts camelCase property names to "Title Case" strings.
 */
function addPropertyTitles(schema: Record<string, unknown>): void {
  const properties = schema.properties as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (!properties) return;

  for (const [key, prop] of Object.entries(properties)) {
    if (!prop.title) {
      prop.title =
        key.charAt(0).toUpperCase() +
        key
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim();
    }
    // Recurse into nested objects
    if (prop.type === "object" && prop.properties) {
      addPropertyTitles(prop);
    }
  }
}
