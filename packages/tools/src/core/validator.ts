import type { ZodSchema } from "zod";
import type { ToolError } from "../types";
import { createToolError } from "./errors";
import { INPUT_REQUIRED, INPUT_INVALID_TYPE } from "./error-codes";

/**
 * Result of input validation.
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ToolError };

/**
 * Validates input against a Zod schema.
 *
 * @param schema - Zod schema to validate against
 * @param input - Raw input to validate
 * @returns Validation result with parsed data or error
 *
 * @example
 * const result = validateInput(inputSchema, userInput);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export function validateInput<T>(
  schema: ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  // Check for null/undefined input
  if (input === null || input === undefined) {
    return {
      success: false,
      error: createToolError({
        code: INPUT_REQUIRED,
        message: "Input is required",
      }),
    };
  }

  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract the first error for user-friendly message
  const firstError = result.error.issues[0] ?? {
    path: [],
    message: "Validation failed",
  };
  const field = firstError.path.join(".") || undefined;
  const message = firstError.message;

  return {
    success: false,
    error: createToolError({
      code: INPUT_INVALID_TYPE,
      message: field ? `Invalid ${field}: ${message}` : message,
      ...(field && { field }),
      details: result.error.issues,
    }),
  };
}

/**
 * Validates options against an optional Zod schema.
 * If no schema is provided, returns undefined (no validation needed).
 * If options is undefined, applies schema defaults.
 *
 * @param schema - Optional Zod schema for options
 * @param options - Raw options to validate
 * @returns Validation result with parsed options or error
 */
export function validateOptions<T>(
  schema: ZodSchema<T> | undefined,
  options: unknown
): ValidationResult<T | undefined> {
  // No schema means no options validation needed
  if (schema === undefined) {
    return { success: true, data: undefined };
  }

  // Parse with defaults applied (safeParse handles undefined gracefully)
  const result = schema.safeParse(options ?? {});

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract the first error
  const firstError = result.error.issues[0] ?? {
    path: [],
    message: "Validation failed",
  };
  const field = firstError.path.join(".") || undefined;
  const message = firstError.message;

  return {
    success: false,
    error: createToolError({
      code: INPUT_INVALID_TYPE,
      message: field ? `Invalid option ${field}: ${message}` : message,
      ...(field && { field }),
      details: result.error.issues,
    }),
  };
}
