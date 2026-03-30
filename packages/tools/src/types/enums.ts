/**
 * Tool execution tier. All tools run entirely in the browser — no server runtime needed.
 */
export enum ToolTier {
  /** Runs in browser, no server required */
  CLIENT = "client",
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
