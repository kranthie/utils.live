/**
 * Category for organizing related tools.
 *
 * Categories provide a fixed organizational structure for the tools
 * on the platform. There are exactly 30 categories.
 */
export interface Category {
  /** Unique identifier (e.g., 'json', 'encoding') */
  id: string;
  /** Display name (e.g., 'JSON Tools') */
  name: string;
  /** Category description for UI */
  description: string;
  /** Lucide icon name */
  icon: string;
  /** Display order (1-30) */
  order: number;
  /** URL slug (same as id) */
  slug: string;
  /** Optional high-level group for filtering (e.g., "Data Formats", "Developer Tools") */
  group?: string;
}

/**
 * Category ID type for type-safe category references.
 */
export type CategoryId = string;
