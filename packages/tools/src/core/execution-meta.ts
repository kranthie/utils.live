import type { ExecutionMeta } from "../types";
import { ToolTier } from "../types";

/**
 * Options for creating execution metadata.
 */
export interface CreateExecutionMetaOptions {
  /** Execution start time (from performance.now() or Date.now()) */
  startTime: number;
  /** Current time for calculating duration */
  endTime: number;
  /** Size of input in bytes */
  inputSizeBytes: number;
  /** Size of output in bytes */
  outputSizeBytes: number;
  /** Tool tier that was executed */
  tier: ToolTier;
  /** Base credit cost for non-client tools */
  baseCredits?: number | undefined;
}

/**
 * Creates execution metadata with timing and size information.
 *
 * @param options - Execution details
 * @returns ExecutionMeta object
 *
 * @example
 * const startTime = performance.now();
 * // ... execute tool
 * const meta = createExecutionMeta({
 *   startTime,
 *   endTime: performance.now(),
 *   inputSizeBytes: Buffer.byteLength(input),
 *   outputSizeBytes: Buffer.byteLength(output),
 *   tier: ToolTier.CLIENT,
 * });
 */
export function createExecutionMeta(
  options: CreateExecutionMetaOptions
): ExecutionMeta {
  const executionTimeMs = options.endTime - options.startTime;

  // Client-side tools are always free
  const creditsUsed =
    options.tier === ToolTier.CLIENT ? 0 : (options.baseCredits ?? 1);

  return {
    executionTimeMs: Math.round(executionTimeMs * 100) / 100, // Round to 2 decimal places
    inputSizeBytes: options.inputSizeBytes,
    outputSizeBytes: options.outputSizeBytes,
    creditsUsed,
    tier: options.tier,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculates the byte size of a value.
 * Works in both browser and Node.js environments.
 *
 * @param value - The value to measure
 * @returns Size in bytes
 */
export function getByteSize(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "string") {
    // Use TextEncoder for accurate UTF-8 byte count
    return new TextEncoder().encode(value).length;
  }

  // For objects, stringify and measure
  try {
    const str = JSON.stringify(value);
    return new TextEncoder().encode(str).length;
  } catch {
    return 0;
  }
}
