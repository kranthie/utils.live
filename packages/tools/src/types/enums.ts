/**
 * Tool execution tier determines where the tool runs and its credit cost.
 */
export enum ToolTier {
  /** Runs in browser, free within limits */
  CLIENT = "client",
  /** Simple server operations, 1 credit */
  SERVER_LIGHT = "server-light",
  /** CPU/memory intensive, 2-5 credits */
  SERVER_HEAVY = "server-heavy",
  /** AI/LLM powered, 1-10 credits */
  AI = "ai",
}

/**
 * String literal union of ToolTier values.
 * Use this in UI components that receive tier values across serialization boundaries (e.g. RSC to client).
 */
export type ToolTierValue = `${ToolTier}`;

/**
 * Option input types for tool configuration.
 */
export enum OptionType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  SELECT = "select",
}
