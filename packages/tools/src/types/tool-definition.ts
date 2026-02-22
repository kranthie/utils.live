import type { z, ZodObject, ZodRawShape } from "zod";
import type { ToolMeta } from "./tool-meta";

/**
 * Complete tool definition with schemas and execution logic.
 *
 * @typeParam I - Input schema shape
 * @typeParam O - Output schema shape
 * @typeParam Opts - Options schema shape (optional)
 */
export interface ToolDefinition<
  I extends ZodRawShape = ZodRawShape,
  O extends ZodRawShape = ZodRawShape,
  Opts extends ZodRawShape | undefined = undefined,
> {
  /** Tool metadata */
  meta: ToolMeta;
  /** Zod schema for input validation */
  inputSchema: ZodObject<I>;
  /** Zod schema for output validation */
  outputSchema: ZodObject<O>;
  /** Optional schema for tool options */
  optionsSchema?: Opts extends ZodRawShape ? ZodObject<Opts> : undefined;
  /**
   * Pure function that executes the tool logic.
   * Must be synchronous for client-side tools.
   * May be async for server-side tools.
   */
  execute: (
    input: z.infer<ZodObject<I>>,
    options?: Opts extends ZodRawShape ? z.infer<ZodObject<Opts>> : undefined
  ) => z.infer<ZodObject<O>> | Promise<z.infer<ZodObject<O>>>;
}
