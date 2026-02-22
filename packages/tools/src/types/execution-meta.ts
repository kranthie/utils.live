import type { ToolTier } from "./enums";

/**
 * Tool execution metadata.
 */
export interface ExecutionMeta {
  /** Execution duration in milliseconds */
  executionTimeMs: number;
  /** Size of input in bytes */
  inputSizeBytes: number;
  /** Size of output in bytes */
  outputSizeBytes: number;
  /** Credits consumed (0 for client-side tools) */
  creditsUsed: number;
  /** Tool tier that was executed */
  tier: ToolTier;
  /** ISO timestamp of execution */
  timestamp: string;
}
