"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Comlink from "comlink";
import { releaseComlinkProxy } from "@/lib/comlink-utils";

/**
 * Worker API type definition matching the exposed worker methods
 */
interface ToolWorkerApi {
  processLargeText: (
    input: string,
    operation: string,
    options?: Record<string, unknown>
  ) => Promise<WorkerResult>;
  hashString: (input: string, algorithm?: string) => Promise<WorkerResult>;
  processJson: (
    input: string,
    options?: Record<string, unknown>
  ) => Promise<WorkerResult>;
  validateRegex: (
    pattern: string,
    testString?: string,
    flags?: string
  ) => Promise<WorkerResult>;
  ping: () => string;
  getCapabilities: () => WorkerCapabilities;
}

interface WorkerResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

interface WorkerCapabilities {
  subtleCrypto: boolean;
  textEncoder: boolean;
  performance: boolean;
}

type ExecutionStatus = "idle" | "loading" | "executing" | "success" | "error";

interface UseWorkerToolExecutionOptions {
  /**
   * Whether to automatically initialize the worker
   * @default true
   */
  autoInit?: boolean;
  /**
   * Callback when execution starts
   */
  onStart?: () => void;
  /**
   * Callback when execution succeeds
   */
  onSuccess?: (result: unknown) => void;
  /**
   * Callback when execution fails
   */
  onError?: (error: Error) => void;
}

interface UseWorkerToolExecutionReturn {
  /**
   * Whether the worker is ready for use
   */
  isReady: boolean;
  /**
   * Current execution status
   */
  status: ExecutionStatus;
  /**
   * Whether execution is in progress
   */
  isExecuting: boolean;
  /**
   * The result of the last execution
   */
  result: unknown;
  /**
   * Any error from worker initialization or execution
   */
  error: Error | null;
  /**
   * Process large text with various operations
   */
  processText: (
    input: string,
    operation:
      | "lineCount"
      | "wordCount"
      | "charCount"
      | "findReplace"
      | "sort"
      | "unique"
      | "reverse"
      | "base64encode"
      | "base64decode",
    options?: Record<string, unknown>
  ) => Promise<unknown>;
  /**
   * Hash a string using various algorithms
   */
  hashString: (
    input: string,
    algorithm?: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"
  ) => Promise<string>;
  /**
   * Parse and format JSON
   */
  processJson: (
    input: string,
    options?: { minify?: boolean; indent?: number }
  ) => Promise<unknown>;
  /**
   * Validate and test regex patterns
   */
  validateRegex: (
    pattern: string,
    testString?: string,
    flags?: string
  ) => Promise<unknown>;
  /**
   * Terminate the worker
   */
  terminate: () => void;
  /**
   * Reinitialize the worker after termination
   */
  reinitialize: () => void;
}

/**
 * Hook for executing tool operations in a Web Worker.
 * Offloads CPU-intensive operations to a background thread.
 */
export function useWorkerToolExecution(
  options: UseWorkerToolExecutionOptions = {}
): UseWorkerToolExecutionReturn {
  const { autoInit = true, onStart, onSuccess, onError } = options;

  const workerRef = useRef<Worker | null>(null);
  const proxyRef = useRef<Comlink.Remote<ToolWorkerApi> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize worker
  const initWorker = useCallback(() => {
    if (typeof Worker === "undefined") {
      setError(new Error("Web Workers are not supported in this browser"));
      return;
    }

    try {
      setStatus("loading");
      const worker = new Worker("/workers/tool-worker.js", { type: "module" });
      workerRef.current = worker;
      proxyRef.current = Comlink.wrap<ToolWorkerApi>(worker);
      setIsReady(true);
      setStatus("idle");
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus("error");
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    if (autoInit) {
      initWorker();
    }

    return (): void => {
      releaseComlinkProxy(proxyRef.current);
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [autoInit, initWorker]);

  // Helper to execute with error handling
  const executeWithHandling = useCallback(
    async <T>(operation: () => Promise<WorkerResult>): Promise<T> => {
      if (!proxyRef.current) {
        throw new Error("Worker is not initialized");
      }

      setStatus("executing");
      setError(null);
      onStart?.();

      try {
        const workerResult = await operation();

        if (!workerResult.success) {
          throw new Error(
            workerResult.error?.message || "Worker execution failed"
          );
        }

        setResult(workerResult.data);
        setStatus("success");
        onSuccess?.(workerResult.data);
        return workerResult.data as T;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setStatus("error");
        onError?.(error);
        throw error;
      }
    },
    [onStart, onSuccess, onError]
  );

  // Process large text
  const processText = useCallback(
    async (
      input: string,
      operation: string,
      opts?: Record<string, unknown>
    ): Promise<unknown> => {
      return executeWithHandling(() =>
        proxyRef.current!.processLargeText(input, operation, opts)
      );
    },
    [executeWithHandling]
  );

  // Hash string
  const hashString = useCallback(
    async (input: string, algorithm?: string): Promise<string> => {
      return executeWithHandling(() =>
        proxyRef.current!.hashString(input, algorithm)
      );
    },
    [executeWithHandling]
  );

  // Process JSON
  const processJson = useCallback(
    async (
      input: string,
      opts?: { minify?: boolean; indent?: number }
    ): Promise<unknown> => {
      return executeWithHandling(() =>
        proxyRef.current!.processJson(input, opts)
      );
    },
    [executeWithHandling]
  );

  // Validate regex
  const validateRegex = useCallback(
    async (
      pattern: string,
      testString?: string,
      flags?: string
    ): Promise<unknown> => {
      return executeWithHandling(() =>
        proxyRef.current!.validateRegex(pattern, testString, flags)
      );
    },
    [executeWithHandling]
  );

  // Terminate worker
  const terminate = useCallback((): void => {
    releaseComlinkProxy(proxyRef.current);
    proxyRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsReady(false);
    setStatus("idle");
  }, []);

  // Reinitialize
  const reinitialize = useCallback(() => {
    terminate();
    initWorker();
  }, [terminate, initWorker]);

  return {
    isReady,
    status,
    isExecuting: status === "executing",
    result,
    error,
    processText,
    hashString,
    processJson,
    validateRegex,
    terminate,
    reinitialize,
  };
}

/**
 * Check if the current environment supports Web Workers
 */
export function supportsWorkers(): boolean {
  return typeof Worker !== "undefined";
}
