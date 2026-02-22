"use client";

import { useState, useCallback, useRef } from "react";

interface UseAIStreamingReturn {
  /** Accumulated streamed content */
  content: string;
  /** Whether stream is active */
  isStreaming: boolean;
  /** Whether stream finished */
  isComplete: boolean;
  /** Error message if failed */
  error: string | null;
  /** Elapsed time in milliseconds (updates during streaming) */
  elapsed: number;
  /** Start streaming a tool execution */
  startStream: (
    toolId: string,
    input: { input: string },
    options?: Record<string, unknown>
  ) => void;
  /** Cancel the stream */
  abort: () => void;
  /** Clear all state */
  reset: () => void;
}

/**
 * Hook for streaming AI tool responses via Server-Sent Events.
 *
 * Calls `POST /api/tools/{toolId}` with `Accept: text/event-stream` header
 * and incrementally accumulates text chunks into React state.
 */
export function useAIStreaming(): UseAIStreamingReturn {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(performance.now() - startTimeRef.current);
    }, 100);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearTimer();
    setIsStreaming(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    abort();
    setContent("");
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
    setElapsed(0);
  }, [abort]);

  const startStream = useCallback(
    (
      toolId: string,
      input: { input: string },
      options?: Record<string, unknown>
    ) => {
      // Abort any in-flight stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimer();

      // Reset state for new stream
      setContent("");
      setIsStreaming(true);
      setIsComplete(false);
      setError(null);
      setElapsed(0);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      startTimer();

      // Fire-and-forget async
      void (async () => {
        try {
          const response = await fetch("/api/ai-stream", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ toolId, input, options }),
            signal: controller.signal,
          });

          if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            try {
              const errorBody = (await response.json()) as {
                error?: { message?: string };
              };
              if (errorBody.error?.message) {
                errorMessage = errorBody.error.message;
              }
            } catch {
              // ignore JSON parse errors on error responses
            }
            setError(errorMessage);
            setIsStreaming(false);
            clearTimer();
            setElapsed(performance.now() - startTimeRef.current);
            return;
          }

          if (!response.body) {
            setError("Response body is not readable");
            setIsStreaming(false);
            clearTimer();
            setElapsed(performance.now() - startTimeRef.current);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            // Keep the last (possibly incomplete) line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                if (data === "[DONE]") {
                  setIsComplete(true);
                  setIsStreaming(false);
                  clearTimer();
                  setElapsed(performance.now() - startTimeRef.current);
                  return;
                }

                // Parse the JSON-encoded chunk
                try {
                  const parsed: unknown = JSON.parse(data);
                  // Check for error events from the stream
                  if (
                    typeof parsed === "object" &&
                    parsed !== null &&
                    "error" in parsed
                  ) {
                    const errObj = parsed as {
                      error: { message?: string; code?: string };
                    };
                    setError(
                      errObj.error.message ?? "Unknown streaming error"
                    );
                    setIsStreaming(false);
                    clearTimer();
                    setElapsed(performance.now() - startTimeRef.current);
                    return;
                  }
                  // Accumulate the text chunk
                  if (typeof parsed === "string") {
                    setContent((prev) => prev + parsed);
                  }
                } catch {
                  // If not valid JSON, use raw data as text
                  setContent((prev) => prev + data);
                }
              }
              // Ignore comment lines (starting with ':') and empty lines
            }
          }

          // Stream ended without [DONE] signal -- treat as complete
          setIsComplete(true);
          setIsStreaming(false);
          clearTimer();
          setElapsed(performance.now() - startTimeRef.current);
        } catch (err: unknown) {
          // Don't treat abort as an error
          if (err instanceof DOMException && err.name === "AbortError") {
            return;
          }

          const message =
            err instanceof Error ? err.message : "An unknown error occurred";
          setError(message);
          setIsStreaming(false);
          clearTimer();
          setElapsed(performance.now() - startTimeRef.current);
        }
      })();
    },
    [clearTimer, startTimer]
  );

  return {
    content,
    isStreaming,
    isComplete,
    error,
    elapsed,
    startStream,
    abort,
    reset,
  };
}
