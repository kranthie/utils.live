import type { ToolResult } from "../types";
import type { ExecuteToolResponse } from "./schemas";

/**
 * Converts a ToolResult to the API response format.
 *
 * The API response format matches the OpenAPI schema and is suitable
 * for JSON serialization in HTTP responses.
 *
 * @param result - The tool execution result
 * @returns API-formatted response
 *
 * @example
 * const result = await executeTool(jsonFormatter, input);
 * const response = toApiResponse(result);
 * res.json(response);
 */
export function toApiResponse<T>(result: ToolResult<T>): ExecuteToolResponse {
  if (result.success) {
    return {
      success: true,
      data: result.data,
      meta: {
        executionTimeMs: result.meta.executionTimeMs,
        inputSizeBytes: result.meta.inputSizeBytes,
        outputSizeBytes: result.meta.outputSizeBytes,
        creditsUsed: result.meta.creditsUsed,
        tier: result.meta.tier,
        timestamp: result.meta.timestamp,
      },
    };
  }

  return {
    success: false,
    error: {
      code: result.error.code,
      message: result.error.message,
      ...(result.error.details !== undefined && {
        details: result.error.details,
      }),
      ...(result.error.field !== undefined && { field: result.error.field }),
      ...(result.error.line !== undefined && { line: result.error.line }),
      ...(result.error.column !== undefined && { column: result.error.column }),
    },
    meta: {
      executionTimeMs: result.meta.executionTimeMs,
      inputSizeBytes: result.meta.inputSizeBytes,
      outputSizeBytes: result.meta.outputSizeBytes,
      creditsUsed: result.meta.creditsUsed,
      tier: result.meta.tier,
      timestamp: result.meta.timestamp,
    },
  };
}

/**
 * Creates a standardized API error response.
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional additional details
 * @returns API error response object
 */
export function createApiError(
  code: string,
  message: string,
  details?: unknown
): { error: { code: string; message: string; details?: unknown } } {
  return {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
}
