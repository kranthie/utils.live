/**
 * Error information for failed tool executions.
 */
export interface ToolError {
  /** Error code (e.g., INPUT_INVALID_JSON) */
  code: string;
  /** User-friendly error message */
  message: string;
  /** Additional error context (optional) */
  details?: unknown;
  /** Field name for validation errors (optional) */
  field?: string;
  /** Line number for parse errors (optional) */
  line?: number;
  /** Column number for parse errors (optional) */
  column?: number;
}

/**
 * Error class for tool execution errors.
 * Extends Error so it can be thrown in strict TypeScript configs
 * that enforce `@typescript-eslint/only-throw-error`.
 */
export class ToolExecutionError extends Error implements ToolError {
  readonly code: string;
  override readonly message: string;
  readonly details?: unknown;
  readonly field?: string;
  readonly line?: number;
  readonly column?: number;

  constructor(options: ToolError) {
    super(options.message);
    this.name = "ToolExecutionError";
    this.code = options.code;
    this.message = options.message;
    if (options.details !== undefined) this.details = options.details;
    if (options.field !== undefined) this.field = options.field;
    if (options.line !== undefined) this.line = options.line;
    if (options.column !== undefined) this.column = options.column;
  }
}
