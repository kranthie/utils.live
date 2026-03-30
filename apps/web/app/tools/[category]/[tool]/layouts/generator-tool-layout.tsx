"use client";

import { useEffect, useCallback, useRef } from "react";
import type { ToolMeta, ToolUIConfig } from "@utils-live/tools/constants";
import { ToolTier } from "@utils-live/tools/constants";
import { ToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/editor/output-panel";
import { AIOutputPanel } from "@/components/tools/ai-output-panel";
import { GeneratorOptionsPanel } from "@/components/tools/generator-options-panel";
import { useToolExecution } from "@/hooks/use-tool-execution";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { getFileExtension } from "./utils";
import type { FormattedSchema } from "./utils";

interface GeneratorToolLayoutProps {
  tool: ToolMeta;
  ui: ToolUIConfig;
  inputSchema: Record<string, unknown>;
  optionsSchema: Record<string, unknown>;
  options: Record<string, unknown>;
  onOptionsChange: (options: Record<string, unknown>) => void;
  generatorInputValues: Record<string, unknown>;
  onGeneratorInputChange: (values: Record<string, unknown>) => void;
  onCopy?: () => void;
  onExecuteReady: (fns: {
    execute: () => void;
    reset: () => void;
    isExecuting: boolean;
    isDebouncing: boolean;
    hasInput: boolean;
  }) => void;
}

export function GeneratorToolLayout({
  tool,
  ui,
  inputSchema,
  optionsSchema,
  options,
  onOptionsChange,
  generatorInputValues,
  onGeneratorInputChange,
  onCopy,
  onExecuteReady,
}: GeneratorToolLayoutProps): React.ReactElement {
  const isAI = tool.tier === ToolTier.AI;
  const isMobile = useIsMobile();

  // --- AI streaming hook (only active for AI-tier tools) ---
  const aiStreaming = useAIStreaming();

  const executeFormBasedTool = useCallback(
    async (inputText: string, opts?: Record<string, unknown>) => {
      let structuredInput: Record<string, unknown>;
      try {
        structuredInput = JSON.parse(inputText) as Record<string, unknown>;
      } catch {
        structuredInput = {};
      }

      // Server-tier tools must be executed on the server via the API route
      if (
        tool.tier === ("server-light" as ToolTier) ||
        tool.tier === ("server-heavy" as ToolTier)
      ) {
        const response = await fetch(`/api/tools/${tool.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: structuredInput, options: opts }),
        });

        const result = (await response.json()) as {
          success: boolean;
          data?: Record<string, unknown>;
          error?: { code: string; message: string };
        };

        if (!result.success) {
          throw new Error(result.error?.message ?? "Tool execution failed");
        }

        const data = result.data as Record<string, unknown>;
        if (typeof data.output === "string") return data.output;
        if (data.output !== undefined) return JSON.stringify(data.output);
        if (typeof data.markdown === "string") return data.markdown;
        return JSON.stringify(data, null, 2);
      }

      // Client-tier tools run directly in the browser
      const { getToolById, executeTool } = await import("@utils-live/tools");
      const toolInstance = getToolById(tool.id);

      if (!toolInstance) {
        throw new Error(`Tool ${tool.id} not found`);
      }

      const result = await executeTool(toolInstance, structuredInput, opts);

      if (!result.success) {
        throw new Error(result.error?.message ?? "Tool execution failed");
      }

      const data = result.data as Record<string, unknown>;
      if (typeof data.output === "string") return data.output;
      if (data.output !== undefined) return JSON.stringify(data.output);
      if (typeof data.markdown === "string") return data.markdown;
      return JSON.stringify(data, null, 2);
    },
    [tool.id, tool.tier]
  );

  const { result, isExecuting, execute, reset } = useToolExecution(
    tool.id,
    executeFormBasedTool
  );

  // Helper to build structured input from generator form values
  const buildStructuredInput = useCallback((): Record<string, unknown> => {
    const inputSchemaProps = (inputSchema.properties ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const structuredInput: Record<string, unknown> = {};

    for (const [key, prop] of Object.entries(inputSchemaProps)) {
      if (generatorInputValues[key] !== undefined) {
        structuredInput[key] = generatorInputValues[key];
      } else if (prop.default !== undefined) {
        structuredInput[key] = prop.default;
      }
    }
    return structuredInput;
  }, [inputSchema, generatorInputValues]);

  // Build and execute with structured input
  const handleFormBasedExecute = useCallback(() => {
    if (isAI) {
      const structuredInput = buildStructuredInput();
      // For AI streaming, serialize input as a single string for the stream endpoint
      const inputStr =
        typeof structuredInput.input === "string"
          ? structuredInput.input
          : JSON.stringify(structuredInput);
      aiStreaming.startStream(tool.id, { input: inputStr }, options);
    } else {
      const structuredInput = buildStructuredInput();
      const inputJson = JSON.stringify(structuredInput);
      void execute(inputJson, options);
    }
  }, [isAI, buildStructuredInput, options, execute, aiStreaming, tool.id]);

  // Store latest values in refs to avoid re-render loop
  const handleFormBasedExecuteRef = useRef(handleFormBasedExecute);
  const resetRef = useRef(reset);
  const aiStreamingRef = useRef(aiStreaming);
  handleFormBasedExecuteRef.current = handleFormBasedExecute;
  resetRef.current = reset;
  aiStreamingRef.current = aiStreaming;

  // Generator tools use the "Generate" button instead of auto-execute.
  // This avoids focus loss from iframe re-renders while the user is typing.

  const stableExecute = useCallback(() => {
    handleFormBasedExecuteRef.current();
  }, []);

  const stableReset = useCallback(() => {
    if (isAI) {
      aiStreamingRef.current.reset();
    } else {
      resetRef.current();
    }
  }, [isAI]);

  // Report execution state to parent
  const isProcessing = isAI ? aiStreaming.isStreaming : isExecuting;

  useEffect(() => {
    onExecuteReady({
      execute: stableExecute,
      reset: stableReset,
      isExecuting: isProcessing,
      isDebouncing: false,
      hasInput: true,
    });
  }, [isProcessing, onExecuteReady, stableExecute, stableReset]);

  const inputSchemaFormatted = inputSchema as unknown as FormattedSchema;
  const optionsSchemaFormatted = optionsSchema as unknown as FormattedSchema;

  return (
    <div
      className={cn(
        "h-[calc(100vh-380px)] max-h-[700px] min-h-[400px]",
        isMobile && "h-[50vh] max-h-[500px] min-h-[300px]"
      )}
    >
      <ToolLayout
        tool={{
          id: tool.id,
          name: tool.name,
          description: tool.description,
          icon: tool.icon ?? "🔧",
          tier: tool.tier,
        }}
        inputLabel="Configure"
        outputLabel="Output"
      >
        <GeneratorOptionsPanel
          inputSchema={inputSchemaFormatted}
          optionsSchema={optionsSchemaFormatted}
          inputValues={generatorInputValues}
          optionValues={options}
          onInputChange={onGeneratorInputChange}
          onOptionChange={onOptionsChange}
          onExecute={handleFormBasedExecute}
          isExecuting={isProcessing}
          toolName={tool.name}
        />
        {isAI ? (
          <AIOutputPanel
            content={aiStreaming.content}
            isStreaming={aiStreaming.isStreaming}
            isComplete={aiStreaming.isComplete}
            error={aiStreaming.error}
            elapsed={aiStreaming.elapsed}
            onAbort={aiStreaming.abort}
          />
        ) : (
          <OutputPanel
            result={result}
            rendererType={ui.outputRenderer}
            language={ui.outputLanguage ?? ui.inputLanguage}
            isLoading={isExecuting}
            isAutoMode={tool.tier === ToolTier.CLIENT}
            downloadFilename={`${tool.name.toLowerCase().replace(/\s+/g, "-")}-output${getFileExtension(ui.outputLanguage ?? ui.inputLanguage)}`}
            onCopy={onCopy}
          />
        )}
      </ToolLayout>
    </div>
  );
}
