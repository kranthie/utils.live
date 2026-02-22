import { ToolExecutionError } from "../types/error";

/**
 * Options for creating a tool error.
 */
export interface CreateToolErrorOptions {
  code: string;
  message: string;
  details?: unknown;
  field?: string;
  line?: number;
  column?: number;
}

/**
 * Creates a ToolExecutionError instance (extends Error) with structured error fields.
 *
 * @param options - Error details
 * @returns A ToolExecutionError instance that can be thrown
 *
 * @example
 * throw createToolError({
 *   code: 'PARSE_INVALID_JSON',
 *   message: 'Invalid JSON: Unexpected token',
 *   line: 1,
 *   column: 5
 * });
 */
export function createToolError(
  options: CreateToolErrorOptions
): ToolExecutionError {
  return new ToolExecutionError(options);
}

/**
 * Extracts line and column from a JSON parse error message.
 *
 * @param errorMessage - The error message from JSON.parse
 * @returns Line and column if found, undefined otherwise
 */
export function extractJsonErrorPosition(
  errorMessage: string
): { line: number; column: number } | undefined {
  // Common patterns:
  // "at position 42"
  // "at line 1 column 5"
  const positionMatch = errorMessage.match(/at position (\d+)/i);
  if (positionMatch?.[1] !== undefined) {
    // Position is character offset, convert to line 1
    return { line: 1, column: parseInt(positionMatch[1], 10) + 1 };
  }

  const lineColumnMatch = errorMessage.match(/line (\d+) column (\d+)/i);
  if (lineColumnMatch?.[1] !== undefined && lineColumnMatch[2] !== undefined) {
    return {
      line: parseInt(lineColumnMatch[1], 10),
      column: parseInt(lineColumnMatch[2], 10),
    };
  }

  return undefined;
}
