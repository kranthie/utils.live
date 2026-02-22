import type { Tool } from "../types";
import { CATEGORIES } from "../categories/categories";

/**
 * Category info with tool count.
 */
export interface CategoryInfo {
  id: string;
  count: number;
}

/**
 * Regex pattern for valid tool IDs: category/tool-name
 * Category: lowercase letters only
 * Tool name: lowercase letters, digits, and hyphens
 */
const TOOL_ID_REGEX = /^[a-z]+\/[a-z0-9-]+$/;

/**
 * Regex pattern for valid category IDs: lowercase letters and hyphens
 */
const CATEGORY_ID_REGEX = /^[a-z-]+$/;

/**
 * Registry for managing and accessing tools.
 *
 * Provides tool registration, lookup by ID/category, and search functionality.
 */
export class ToolRegistry {
  private readonly tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool in the registry.
   *
   * @param tool - Tool to register
   * @throws Error if tool ID is invalid or already registered
   */
  registerTool(tool: Tool): void {
    const id = tool.meta.id;

    // Validate tool ID format
    if (!TOOL_ID_REGEX.test(id)) {
      throw new Error(
        `Invalid tool ID '${id}': must match pattern 'category/tool-name' (e.g., 'json/formatter')`
      );
    }

    // Validate that the category portion matches a valid category
    const categoryPart = id.split("/")[0]!;
    const validCategoryIds = CATEGORIES.map((c) => c.id);
    if (!validCategoryIds.includes(categoryPart)) {
      throw new Error(
        `Invalid category '${categoryPart}' in tool ID '${id}': must be one of [${validCategoryIds.join(", ")}]`
      );
    }

    if (this.tools.has(id)) {
      throw new Error(`Tool with ID '${id}' is already registered`);
    }
    this.tools.set(id, tool);
  }

  /**
   * Get a tool by its ID.
   *
   * @param id - Tool ID (e.g., 'json/formatter')
   * @returns Tool if found, undefined otherwise
   */
  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools.
   *
   * @returns Array of all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tools in a specific category.
   *
   * @param category - Category ID
   * @returns Array of tools in the category
   * @throws Error if category ID format is invalid
   */
  getByCategory(category: string): Tool[] {
    if (!CATEGORY_ID_REGEX.test(category)) {
      throw new Error(
        `Invalid category ID '${category}': must contain only lowercase letters and hyphens`
      );
    }
    return this.getAll().filter((tool) => tool.meta.category === category);
  }

  /**
   * Search for tools matching a query.
   *
   * Searches in: name, description, keywords.
   * Search is case-insensitive and supports partial matches.
   *
   * @param query - Search query
   * @returns Array of matching tools
   */
  search(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();

    return this.getAll().filter((tool) => {
      const meta = tool.meta;

      // Check name
      if (meta.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Check description
      if (meta.description.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Check keywords
      if (meta.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get unique categories with tool counts.
   *
   * @returns Array of category info with counts
   */
  getCategories(): CategoryInfo[] {
    const categoryCounts = new Map<string, number>();

    for (const tool of this.tools.values()) {
      const category = tool.meta.category;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    return Array.from(categoryCounts.entries()).map(([id, count]) => ({
      id,
      count,
    }));
  }

  /**
   * Get the number of registered tools.
   *
   * @returns Tool count
   */
  get size(): number {
    return this.tools.size;
  }

  /**
   * Get the number of registered tools.
   * Method version for spec compliance.
   *
   * @returns Tool count
   */
  count(): number {
    return this.tools.size;
  }

  /**
   * Check if a tool is registered.
   *
   * @param id - Tool ID
   * @returns true if tool exists
   */
  has(id: string): boolean {
    return this.tools.has(id);
  }

  /**
   * Clear all registered tools.
   * Mainly useful for testing.
   */
  clear(): void {
    this.tools.clear();
  }
}

/**
 * Global tool registry instance.
 * Tools auto-register to this instance on import.
 */
export const globalRegistry = new ToolRegistry();

/**
 * Search for tools in the global registry.
 *
 * @param query - Search query
 * @returns Array of matching tools
 */
export function searchTools(query: string): Tool[] {
  return globalRegistry.search(query);
}

/**
 * Get a tool from the global registry by ID.
 *
 * @param id - Tool ID
 * @returns Tool if found, undefined otherwise
 */
export function getToolById(id: string): Tool | undefined {
  return globalRegistry.get(id);
}

/**
 * Get all tools in a category from the global registry.
 *
 * @param category - Category ID
 * @returns Array of tools
 */
export function getToolsByCategory(category: string): Tool[] {
  return globalRegistry.getByCategory(category);
}

/**
 * Get all tools from the global registry.
 *
 * @returns Array of all tools
 */
export function getAllTools(): Tool[] {
  return globalRegistry.getAll();
}
