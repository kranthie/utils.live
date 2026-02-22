"use client";

import { useState, useCallback, useRef } from "react";

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: {
      line?: number;
      column?: number;
      path?: string;
    };
  };
  metadata?: {
    executionTime: number;
    inputSize: number;
    outputSize: number;
  };
}

type ExecutionStatus = "idle" | "executing" | "success" | "error";

interface UseToolExecutionOptions {
  /**
   * Callback when execution starts
   */
  onStart?: () => void;
  /**
   * Callback when execution succeeds
   */
  onSuccess?: (result: ToolResult<unknown>) => void;
  /**
   * Callback when execution fails
   */
  onError?: (error: Error) => void;
  /**
   * Debounce delay in ms for auto-execution
   * @default 300
   */
  debounceDelay?: number;
}

interface UseToolExecutionReturn<T> {
  /**
   * Current execution result
   */
  result: ToolResult<T> | null;
  /**
   * Current execution status
   */
  status: ExecutionStatus;
  /**
   * Whether execution is in progress
   */
  isExecuting: boolean;
  /**
   * Error from the last execution
   */
  error: Error | null;
  /**
   * Execute the tool with given input and options
   */
  execute: (input: string, options?: Record<string, unknown>) => Promise<void>;
  /**
   * Reset the execution state
   */
  reset: () => void;
}

/**
 * Hook for executing tools and managing execution state.
 * Supports both client-side and server-side tool execution.
 */
export function useToolExecution<T = unknown>(
  _toolId: string,
  executeFn: (
    input: string,
    options?: Record<string, unknown>
  ) => Promise<T> | T,
  options: UseToolExecutionOptions = {}
): UseToolExecutionReturn<T> {
  const { onStart, onSuccess, onError } = options;

  const [result, setResult] = useState<ToolResult<T> | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const executionIdRef = useRef(0);

  const execute = useCallback(
    async (
      input: string,
      toolOptions?: Record<string, unknown>
    ): Promise<void> => {
      const currentExecutionId = ++executionIdRef.current;
      const startTime = performance.now();

      setStatus("executing");
      setError(null);
      onStart?.();

      try {
        // Execute the tool
        const data = await Promise.resolve(executeFn(input, toolOptions));

        // Check if this execution is still current
        if (currentExecutionId !== executionIdRef.current) {
          return;
        }

        const executionTime = performance.now() - startTime;
        const outputStr =
          typeof data === "string" ? data : JSON.stringify(data);

        const toolResult: ToolResult<T> = {
          success: true,
          data,
          metadata: {
            executionTime,
            inputSize: new TextEncoder().encode(input).length,
            outputSize: new TextEncoder().encode(outputStr).length,
          },
        };

        setResult(toolResult);
        setStatus("success");
        onSuccess?.(toolResult as ToolResult<unknown>);
      } catch (err) {
        // Check if this execution is still current
        if (currentExecutionId !== executionIdRef.current) {
          return;
        }

        const executionTime = performance.now() - startTime;
        // Handle both Error instances and plain ToolError objects ({ code, message })
        const isToolError =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          "message" in err &&
          typeof (err as { code: unknown }).code === "string" &&
          typeof (err as { message: unknown }).message === "string";

        const error =
          err instanceof Error
            ? err
            : new Error(
                isToolError ? (err as { message: string }).message : String(err)
              );

        const toolResult: ToolResult<T> = {
          success: false,
          error: {
            code: isToolError
              ? (err as { code: string }).code
              : "EXECUTION_ERROR",
            message: error.message,
          },
          metadata: {
            executionTime,
            inputSize: new TextEncoder().encode(input).length,
            outputSize: 0,
          },
        };

        setResult(toolResult);
        setError(error);
        setStatus("error");
        onError?.(error);
      }
    },
    [executeFn, onStart, onSuccess, onError]
  );

  const reset = useCallback(() => {
    executionIdRef.current++;
    setResult(null);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    result,
    status,
    isExecuting: status === "executing",
    error,
    execute,
    reset,
  };
}
