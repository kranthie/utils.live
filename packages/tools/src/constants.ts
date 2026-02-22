/**
 * @utils-live/tools/constants
 *
 * Lightweight entry point exporting only types, enums, and constants.
 * No tool implementations or heavy dependencies are included.
 *
 * Client components should import from this module instead of the
 * main barrel export to avoid pulling in the entire tools registry
 * (800+ tool implementations and their transitive dependencies).
 */

// Enums
export { ToolTier, OptionType } from "./types/enums";
export type { ToolTierValue } from "./types/enums";

// Type-only exports (zero runtime cost)
export type { CreditConfig } from "./types/credit";
export type { ExecutionMeta } from "./types/execution-meta";
export type { ToolError } from "./types/error";
export type { ToolResult, ToolSuccess, ToolFailure } from "./types/result";
export type { ToolMeta, ToolExample } from "./types/tool-meta";
export type { ToolDefinition } from "./types/tool-definition";
export type { Tool } from "./types/tool";
export type { Category, CategoryId } from "./types/category";
export type {
  ToolOption,
  ToolOptions,
  OptionConstraints,
} from "./types/options";
export type { ToolInput, ExecuteInput } from "./types/input";

// UI Types and constants
export type {
  MonacoLanguage,
  OutputRendererType,
  ToolUIConfig,
} from "./types/tool-ui";
export {
  DEFAULT_UI_CONFIG,
  CATEGORY_INPUT_LANGUAGES,
  CATEGORY_OUTPUT_RENDERERS,
  DIFF_TOOL_PATTERNS,
  COLOR_PALETTE_PATTERNS,
} from "./types/tool-ui";
