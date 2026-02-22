import type { z, ZodObject, ZodRawShape } from "zod";
import type { ToolMeta, Tool } from "../types";
import { toolIdSchema } from "../api/schemas";

/**
 * Input for defining a tool.
 */
export interface DefineToolInput<
  I extends ZodRawShape,
  O extends ZodRawShape,
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

/**
 * Creates a tool definition with type-safe input/output handling.
 *
 * @param definition - Tool definition with schemas and execute function
 * @returns A Tool object ready for registration and execution
 *
 * @example
 * const jsonFormatter = defineTool({
 *   meta: {
 *     id: 'json/formatter',
 *     name: 'JSON Formatter',
 *     description: 'Formats JSON with configurable indentation',
 *     category: 'json',
 *     tier: ToolTier.CLIENT,
 *     keywords: ['json', 'format', 'prettify'],
 *   },
 *   inputSchema: z.object({ input: z.string() }),
 *   outputSchema: z.object({ output: z.string() }),
 *   optionsSchema: z.object({ indent: z.number().default(2) }),
 *   execute: (input, options) => {
 *     const parsed = JSON.parse(input.input);
 *     return { output: JSON.stringify(parsed, null, options?.indent ?? 2) };
 *   },
 * });
 */
export function defineTool<
  I extends ZodRawShape,
  O extends ZodRawShape,
  Opts extends ZodRawShape | undefined = undefined,
>(definition: DefineToolInput<I, O, Opts>): Tool {
  // Validate tool ID at definition time
  const idResult = toolIdSchema.safeParse(definition.meta.id);
  if (!idResult.success) {
    throw new Error(
      `Invalid tool ID "${definition.meta.id}": Tool ID must match pattern "category/tool-name" (e.g., "json/formatter")`
    );
  }

  return {
    meta: definition.meta,
    inputSchema: definition.inputSchema,
    outputSchema: definition.outputSchema,
    optionsSchema: definition.optionsSchema,
    execute: definition.execute as Tool["execute"],
  };
}
