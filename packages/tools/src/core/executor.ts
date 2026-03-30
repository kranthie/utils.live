import type { Tool, ToolResult, ToolError, ToolTier } from "../types";
import { validateInput, validateOptions } from "./validator";
import { createToolError } from "./errors";
import { createExecutionMeta, getByteSize } from "./execution-meta";
import { EXEC_FAILED, EXEC_TIMEOUT } from "./error-codes";

/**
 * Timeout limits per tool tier in milliseconds.
 */
const TIER_TIMEOUTS: Record<ToolTier, number> = {
  client: 5000, // 5 seconds
};

/**
 * Custom error class for tool execution timeouts.
 * Used instead of string matching on error messages for reliable timeout detection.
 */
class TimeoutError extends Error {
  readonly timeoutMs: number;
  constructor(ms: number) {
    super(`Tool execution timed out after ${ms}ms`);
    this.name = "TimeoutError";
    this.timeoutMs = ms;
  }
}

/**
 * Creates a timeout promise that rejects after the specified duration.
 * Returns both the promise and a cleanup function to clear the timer.
 */
function createTimeoutPromise(ms: number): {
  promise: Promise<never>;
  cleanup: () => void;
} {
  let timerId: ReturnType<typeof setTimeout>;
  const promise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      reject(new TimeoutError(ms));
    }, ms);
  });
  return { promise, cleanup: () => clearTimeout(timerId) };
}

/**
 * Type guard to check if an error is a ToolError.
 */
function isToolError(err: unknown): err is ToolError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    typeof (err as ToolError).code === "string" &&
    typeof (err as ToolError).message === "string"
  );
}

/**
 * Executes a tool with the given input and options.
 *
 * This function:
 * 1. Validates input against the tool's input schema
 * 2. Validates options against the tool's options schema (if any)
 * 3. Executes the tool's execute function
 * 4. Wraps the result in a ToolResult with execution metadata
 *
 * @param tool - The tool to execute
 * @param input - Raw input data
 * @param options - Optional tool options
 * @returns ToolResult with success/data or error
 *
 * @example
 * const result = await executeTool(jsonFormatter, { input: '{"a":1}' });
 * if (result.success) {
 *   console.log(result.data.output);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export async function executeTool<T = unknown>(
  tool: Tool,
  input: unknown,
  options?: unknown
): Promise<ToolResult<T>> {
  const startTime = performance.now();
  const inputSizeBytes = getByteSize(input);

  // Validate input
  const inputResult = validateInput(tool.inputSchema, input);
  if (!inputResult.success) {
    return {
      success: false,
      error: inputResult.error,
      meta: createExecutionMeta({
        startTime,
        endTime: performance.now(),
        inputSizeBytes,
        outputSizeBytes: 0,
        tier: tool.meta.tier,
        baseCredits: tool.meta.credits?.base,
      }),
    };
  }

  // Validate options if schema exists
  const optionsResult = validateOptions(tool.optionsSchema, options);
  if (!optionsResult.success) {
    return {
      success: false,
      error: optionsResult.error,
      meta: createExecutionMeta({
        startTime,
        endTime: performance.now(),
        inputSizeBytes,
        outputSizeBytes: 0,
        tier: tool.meta.tier,
        baseCredits: tool.meta.credits?.base,
      }),
    };
  }

  // Pre-execution input size check to prevent memory exhaustion
  // Reject inputs larger than 5MB before tool execution
  const MAX_INPUT_SIZE_BYTES = 5 * 1024 * 1024;
  if (inputSizeBytes > MAX_INPUT_SIZE_BYTES) {
    return {
      success: false,
      error: createToolError({
        code: EXEC_FAILED,
        message: `Input too large (${(inputSizeBytes / 1024 / 1024).toFixed(1)}MB). Maximum allowed: 5MB.`,
      }),
      meta: createExecutionMeta({
        startTime,
        endTime: performance.now(),
        inputSizeBytes,
        outputSizeBytes: 0,
        tier: tool.meta.tier,
        baseCredits: tool.meta.credits?.base,
      }),
    };
  }

  // Execute the tool with timeout enforcement.
  // NOTE: For synchronous tools, Promise.race cannot interrupt CPU-bound
  // execution. Individual tools should implement their own safety checks
  // (e.g., regex-tester checks for ReDoS patterns before execution).
  // For full protection, synchronous tools could be run in worker_threads
  // (server) or Web Workers (client) in a future enhancement.
  const timeoutMs = TIER_TIMEOUTS[tool.meta.tier];
  const { promise: timeoutPromise, cleanup: cleanupTimeout } =
    createTimeoutPromise(timeoutMs);

  try {
    const output = await Promise.race([
      Promise.resolve(tool.execute(inputResult.data, optionsResult.data)),
      timeoutPromise,
    ]);
    cleanupTimeout();
    const outputSizeBytes = getByteSize(output);

    return {
      success: true,
      data: output as T,
      meta: createExecutionMeta({
        startTime,
        endTime: performance.now(),
        inputSizeBytes,
        outputSizeBytes,
        tier: tool.meta.tier,
        baseCredits: tool.meta.credits?.base,
      }),
    };
  } catch (err) {
    cleanupTimeout();
    // Check for timeout error
    if (err instanceof TimeoutError) {
      return {
        success: false,
        error: createToolError({
          code: EXEC_TIMEOUT,
          message: `Tool execution timed out after ${timeoutMs}ms`,
          details: { timeoutMs, tier: tool.meta.tier },
        }),
        meta: createExecutionMeta({
          startTime,
          endTime: performance.now(),
          inputSizeBytes,
          outputSizeBytes: 0,
          tier: tool.meta.tier,
          baseCredits: tool.meta.credits?.base,
        }),
      };
    }

    // If the tool threw a ToolError, use it as a plain object (ensures JSON serialization works)
    if (isToolError(err)) {
      return {
        success: false,
        error: { code: err.code, message: err.message },
        meta: createExecutionMeta({
          startTime,
          endTime: performance.now(),
          inputSizeBytes,
          outputSizeBytes: 0,
          tier: tool.meta.tier,
          baseCredits: tool.meta.credits?.base,
        }),
      };
    }

    // Otherwise wrap in EXEC_FAILED
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    return {
      success: false,
      error: createToolError({
        code: EXEC_FAILED,
        message: `Execution failed: ${errorMessage}`,
      }),
      meta: createExecutionMeta({
        startTime,
        endTime: performance.now(),
        inputSizeBytes,
        outputSizeBytes: 0,
        tier: tool.meta.tier,
        baseCredits: tool.meta.credits?.base,
      }),
    };
  }
}
