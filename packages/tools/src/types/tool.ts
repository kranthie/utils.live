import type { ZodSchema } from "zod";
import type { ToolMeta } from "./tool-meta";

/**
 * Simplified tool interface for runtime use (schemas pre-compiled).
 */
export interface Tool {
  /** Tool metadata */
  meta: ToolMeta;
  /** Zod schema for input validation */
  inputSchema: ZodSchema;
  /** Zod schema for output validation */
  outputSchema: ZodSchema;
  /** Optional schema for tool options */
  optionsSchema?: ZodSchema | undefined;
  /**
   * Execute the tool with validated input.
   */
  execute: (input: unknown, options?: unknown) => unknown;
}
