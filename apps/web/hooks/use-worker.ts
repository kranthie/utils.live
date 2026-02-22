"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Comlink from "comlink";
import { releaseComlinkProxy } from "@/lib/comlink-utils";

interface UseWorkerOptions {
  /**
   * Whether to terminate the worker when the component unmounts
   * @default true
   */
  terminateOnUnmount?: boolean;
}

interface UseWorkerReturn<T> {
  /**
   * The wrapped worker API
   */
  worker: Comlink.Remote<T> | null;
  /**
   * Whether the worker is ready
   */
  isReady: boolean;
  /**
   * Any error that occurred during worker initialization
   */
  error: Error | null;
  /**
   * Terminate the worker manually
   */
  terminate: () => void;
}

interface WorkerState<T> {
  proxy: Comlink.Remote<T> | null;
  isReady: boolean;
  error: Error | null;
}

function initWorker<T>(workerFactory: () => Worker): {
  state: WorkerState<T>;
  worker: Worker | null;
  proxy: Comlink.Remote<T> | null;
} {
  if (typeof Worker === "undefined") {
    return {
      state: {
        proxy: null,
        isReady: false,
        error: new Error("Web Workers are not supported in this browser"),
      },
      worker: null,
      proxy: null,
    };
  }

  try {
    const worker = workerFactory();
    const proxy = Comlink.wrap<T>(worker);
    return {
      state: { proxy, isReady: true, error: null },
      worker,
      proxy,
    };
  } catch (err) {
    const initError = err instanceof Error ? err : new Error(String(err));
    return {
      state: { proxy: null, isReady: false, error: initError },
      worker: null,
      proxy: null,
    };
  }
}

/**
 * Hook for using Web Workers with Comlink.
 * Provides a type-safe wrapper around the worker API.
 *
 * @param workerFactory - Function that creates the worker
 * @param options - Configuration options
 */
export function useWorker<T>(
  workerFactory: () => Worker,
  options: UseWorkerOptions = {}
): UseWorkerReturn<T> {
  const { terminateOnUnmount = true } = options;

  const [initResult] = useState(() => initWorker<T>(workerFactory));
  const workerRef = useRef<Worker | null>(initResult.worker);
  const proxyRef = useRef<Comlink.Remote<T> | null>(initResult.proxy);
  const [state, setState] = useState<WorkerState<T>>(initResult.state);

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      if (terminateOnUnmount && workerRef.current) {
        releaseComlinkProxy(proxyRef.current);
        workerRef.current.terminate();
        workerRef.current = null;
        proxyRef.current = null;
      }
    };
  }, [terminateOnUnmount]);

  const terminate = useCallback((): void => {
    releaseComlinkProxy(proxyRef.current);
    proxyRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setState({ proxy: null, isReady: false, error: null });
  }, []);

  return {
    worker: state.proxy,
    isReady: state.isReady,
    error: state.error,
    terminate,
  };
}

/**
 * Check if Web Workers are supported in the current environment
 */
export function supportsWorkers(): boolean {
  return typeof Worker !== "undefined";
}

/**
 * Create a worker factory function for a given module URL
 */
export function createWorkerFactory(moduleUrl: URL): () => Worker {
  return () => new Worker(moduleUrl, { type: "module" });
}
