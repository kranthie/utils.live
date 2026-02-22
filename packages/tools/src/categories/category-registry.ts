import type { Category } from "../types";
import { CATEGORIES, getCategoryById, getAllCategories } from "./categories";
import { globalRegistry } from "../core/registry";

/**
 * Regex pattern for valid category IDs: lowercase letters and hyphens
 */
const CATEGORY_ID_REGEX = /^[a-z-]+$/;

/**
 * Registry for managing and accessing tool categories.
 *
 * Provides a class-based interface for category operations.
 * Categories are a fixed set of 28, defined at build time.
 */
export class CategoryRegistry {
  private readonly categories: readonly Category[];
  private readonly categoryMap: Map<string, Category>;

  constructor() {
    this.categories = CATEGORIES;
    this.categoryMap = new Map(CATEGORIES.map((cat) => [cat.id, cat]));
  }

  /**
   * Get a category by its ID.
   *
   * @param id - Category ID
   * @returns Category if found, undefined otherwise
   * @throws Error if category ID format is invalid
   */
  get(id: string): Category | undefined {
    if (!CATEGORY_ID_REGEX.test(id)) {
      throw new Error(
        `Invalid category ID '${id}': must contain only lowercase letters and hyphens`
      );
    }
    return this.categoryMap.get(id);
  }

  /**
   * Get all categories sorted by order.
   *
   * @returns All 28 categories
   */
  getAll(): readonly Category[] {
    return this.categories;
  }

  /**
   * Check if a category exists.
   *
   * @param id - Category ID
   * @returns true if category exists
   */
  has(id: string): boolean {
    return this.categoryMap.has(id);
  }

  /**
   * Get all category IDs.
   *
   * @returns Array of category IDs
   */
  getIds(): string[] {
    return Array.from(this.categoryMap.keys());
  }

  /**
   * Get the number of tools in a category.
   *
   * @param categoryId - Category ID
   * @returns Number of tools in the category
   * @throws Error if category ID format is invalid
   */
  getToolCount(categoryId: string): number {
    if (!CATEGORY_ID_REGEX.test(categoryId)) {
      throw new Error(
        `Invalid category ID '${categoryId}': must contain only lowercase letters and hyphens`
      );
    }
    return globalRegistry.getByCategory(categoryId).length;
  }
}

// Re-export helper functions for convenience
export { getCategoryById, getAllCategories };
