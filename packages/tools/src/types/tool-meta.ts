import type { ToolTier } from "./enums";
import type { CreditConfig } from "./credit";
import type { ToolUIConfig } from "./tool-ui";

/**
 * A usage example for tool documentation.
 */
export interface ToolExample {
  /** Short title for the example tab */
  title: string;
  /** Optional longer description */
  description?: string;
  /** Example input (string for standard tools, object for generator tools) */
  input: string | Record<string, unknown>;
  /** Expected output string */
  output: string;
  /** Optional example options/configuration */
  options?: Record<string, unknown>;
}

/**
 * Tool metadata for display and discovery.
 */
export interface ToolMeta {
  /** Unique identifier: {category}/{tool-name} */
  id: string;
  /** Human-readable name */
  name: string;
  /** Brief description for listings and SEO */
  description: string;
  /** Category ID this tool belongs to */
  category: string;
  /** Execution tier */
  tier: ToolTier;
  /** Searchable keywords */
  keywords: string[];
  /** Credit configuration (for non-client tools) */
  credits?: CreditConfig;
  /** UI rendering configuration (optional, inferred if missing) */
  ui?: Partial<ToolUIConfig>;
  /** Icon emoji or Lucide icon name */
  icon?: string;
  /** Usage examples for documentation */
  examples?: ToolExample[];
  /** Optional sub-group within the category for filtering */
  subgroup?: string;
}
