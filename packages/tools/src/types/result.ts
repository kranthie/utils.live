import type { ExecutionMeta } from "./execution-meta";
import type { ToolError } from "./error";

/**
 * Result of a successful tool execution.
 */
export interface ToolSuccess<T> {
  success: true;
  data: T;
  meta: ExecutionMeta;
}

/**
 * Result of a failed tool execution.
 */
export interface ToolFailure {
  success: false;
  error: ToolError;
  meta: ExecutionMeta;
}

/**
 * Discriminated union result type for tool execution.
 * Use `result.success` to narrow the type.
 */
export type ToolResult<T> = ToolSuccess<T> | ToolFailure;
