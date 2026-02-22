/**
 * Input types for tool execution.
 */

/**
 * Input for a single tool execution.
 * Represents user-provided data before validation.
 */
export interface ToolInput {
  /** Input data (validated against tool's inputSchema) */
  input: unknown;
  /** Tool options (validated against tool's optionsSchema) */
  options?: Record<string, unknown>;
}

/**
 * Input for tool execution via executor.
 * Used when calling the executor with a specific tool.
 */
export interface ExecuteInput {
  /** Tool ID to execute (e.g., 'json/formatter') */
  toolId: string;
  /** Input data (validated against tool's inputSchema) */
  input: unknown;
  /** Tool options (validated against tool's optionsSchema) */
  options?: Record<string, unknown>;
}
