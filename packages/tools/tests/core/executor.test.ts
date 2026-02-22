import { describe, it, expect } from "vitest";
import { z } from "zod";
import { executeTool } from "../../src/core/executor";
import { defineTool } from "../../src/core/define-tool";
import { ToolTier, ToolExecutionError } from "../../src/types";

describe("executeTool", () => {
  const echoTool = defineTool({
    meta: {
      id: "test/echo",
      name: "Echo",
      description: "Echoes input back",
      category: "test",
      tier: ToolTier.CLIENT,
      keywords: ["echo", "test"],
    },
    inputSchema: z.object({
      message: z.string(),
    }),
    outputSchema: z.object({
      echoed: z.string(),
    }),
    execute: (input) => ({ echoed: input.message }),
  });

  it("should execute tool successfully with valid input", async () => {
    const result = await executeTool(echoTool, { message: "hello" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ echoed: "hello" });
      expect(result.meta.tier).toBe(ToolTier.CLIENT);
      expect(result.meta.creditsUsed).toBe(0);
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(0);
    }
  });

  it("should return validation error for invalid input", async () => {
    const result = await executeTool(echoTool, { message: 123 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
      expect(result.error.field).toBe("message");
    }
  });

  it("should return error for missing required input", async () => {
    const result = await executeTool(echoTool, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
    }
  });

  it("should handle tool execution errors gracefully", async () => {
    const failingTool = defineTool({
      meta: {
        id: "test/failing",
        name: "Failing",
        description: "Always fails",
        category: "test",
        tier: ToolTier.CLIENT,
        keywords: ["fail"],
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: () => {
        throw new Error("Tool failed!");
      },
    });

    const result = await executeTool(failingTool, { input: "test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("EXEC_FAILED");
      expect(result.error.message).toContain("Tool failed!");
    }
  });

  it("should handle async tools", async () => {
    const asyncTool = defineTool({
      meta: {
        id: "test/async",
        name: "Async",
        description: "Async tool",
        category: "test",
        tier: ToolTier.CLIENT,
        keywords: ["async"],
      },
      inputSchema: z.object({ delay: z.number() }),
      outputSchema: z.object({ done: z.boolean() }),
      execute: async (input) => {
        await new Promise((resolve) => setTimeout(resolve, input.delay));
        return { done: true };
      },
    });

    const result = await executeTool(asyncTool, { delay: 10 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ done: true });
      // Allow for timing variations (setTimeout is not precise)
      expect(result.meta.executionTimeMs).toBeGreaterThanOrEqual(5);
    }
  });

  it("should include input and output size in metadata", async () => {
    const result = await executeTool(echoTool, { message: "hello world" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.inputSizeBytes).toBeGreaterThan(0);
      expect(result.meta.outputSizeBytes).toBeGreaterThan(0);
    }
  });

  it("should include timestamp in metadata", async () => {
    const beforeTime = new Date().toISOString();
    const result = await executeTool(echoTool, { message: "test" });
    const afterTime = new Date().toISOString();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.timestamp).toBeDefined();
      expect(result.meta.timestamp >= beforeTime).toBe(true);
      expect(result.meta.timestamp <= afterTime).toBe(true);
    }
  });

  it("should use credits from tool config for non-client tier", async () => {
    const serverTool = defineTool({
      meta: {
        id: "test/server",
        name: "Server Tool",
        description: "A server tool with credits",
        category: "test",
        tier: ToolTier.SERVER_LIGHT,
        keywords: ["server"],
        credits: { base: 5 },
      },
      inputSchema: z.object({ data: z.string() }),
      outputSchema: z.object({ result: z.string() }),
      execute: (input) => ({ result: input.data }),
    });

    const result = await executeTool(serverTool, { data: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.meta.creditsUsed).toBe(5);
    }
  });

  it("should use credits from tool config when validation fails", async () => {
    const serverTool = defineTool({
      meta: {
        id: "test/server2",
        name: "Server Tool 2",
        description: "A server tool with credits",
        category: "test",
        tier: ToolTier.AI,
        keywords: ["ai"],
        credits: { base: 10 },
      },
      inputSchema: z.object({ data: z.string() }),
      outputSchema: z.object({ result: z.string() }),
      execute: (input) => ({ result: input.data }),
    });

    // Invalid input should still track credits
    const result = await executeTool(serverTool, { data: 123 });
    expect(result.success).toBe(false);
  });

  it("should handle tool throwing ToolError", async () => {
    const toolErrorThrower = defineTool({
      meta: {
        id: "test/tool-error",
        name: "ToolError Thrower",
        description: "Throws a ToolError",
        category: "test",
        tier: ToolTier.CLIENT,
        keywords: ["error"],
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: () => {
        // Throw a ToolExecutionError
        throw new ToolExecutionError({
          code: "CUSTOM_ERROR",
          message: "Custom tool error",
        });
      },
    });

    const result = await executeTool(toolErrorThrower, { input: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("CUSTOM_ERROR");
      expect(result.error.message).toBe("Custom tool error");
    }
  });

  it("should handle tool with credits throwing ToolError", async () => {
    const toolWithCreditsError = defineTool({
      meta: {
        id: "test/credits-tool-error",
        name: "Credits ToolError Thrower",
        description: "Throws a ToolError with credits config",
        category: "test",
        tier: ToolTier.AI,
        keywords: ["error", "credits"],
        credits: { base: 10 },
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: () => {
        throw new ToolExecutionError({
          code: "AI_ERROR",
          message: "AI processing failed",
        });
      },
    });

    const result = await executeTool(toolWithCreditsError, { input: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("AI_ERROR");
      expect(result.meta.creditsUsed).toBe(10);
    }
  });

  it("should handle tool with credits throwing regular Error", async () => {
    const toolWithCreditsRegularError = defineTool({
      meta: {
        id: "test/credits-regular-error",
        name: "Credits Regular Error",
        description: "Throws a regular Error with credits config",
        category: "test",
        tier: ToolTier.SERVER_HEAVY,
        keywords: ["error", "credits"],
        credits: { base: 3 },
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: () => {
        throw new Error("Regular error with credits");
      },
    });

    const result = await executeTool(toolWithCreditsRegularError, {
      input: "test",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("EXEC_FAILED");
      expect(result.error.message).toContain("Regular error with credits");
      // details (stack trace) removed in production for security
    }
  });

  it("should handle non-Error thrown values", async () => {
    const stringThrower = defineTool({
      meta: {
        id: "test/string-thrower",
        name: "String Thrower",
        description: "Throws a string",
        category: "test",
        tier: ToolTier.CLIENT,
        keywords: ["error"],
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      execute: () => {
        // Intentionally throw a non-Error value to test executor's fallback handling
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "Just a string error";
      },
    });

    const result = await executeTool(stringThrower, { input: "test" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("EXEC_FAILED");
      expect(result.error.message).toContain("Unknown error occurred");
    }
  });

  it("should handle options validation failure", async () => {
    const toolWithOptions = defineTool({
      meta: {
        id: "test/with-options",
        name: "Tool With Options",
        description: "Has options schema",
        category: "test",
        tier: ToolTier.SERVER_HEAVY,
        keywords: ["options"],
        credits: { base: 3 },
      },
      inputSchema: z.object({ input: z.string() }),
      outputSchema: z.object({ output: z.string() }),
      optionsSchema: z.object({ indent: z.number().min(0).max(8) }),
      execute: (input) => ({ output: input.input }),
    });

    // Invalid option value
    const result = await executeTool(
      toolWithOptions,
      { input: "test" },
      { indent: 100 }
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("INPUT_INVALID_TYPE");
    }
  });
});
