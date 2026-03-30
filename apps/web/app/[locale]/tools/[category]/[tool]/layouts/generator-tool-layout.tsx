"use client";

import { useEffect, useCallback, useRef } from "react";
import type { ToolMeta, ToolUIConfig } from "@utils-live/tools/constants";
import { ToolLayout } from "@/components/tools/tool-layout";
import { OutputPanel } from "@/components/editor/output-panel";
import { GeneratorOptionsPanel } from "@/components/tools/generator-options-panel";
import { useToolExecution } from "@/hooks/use-tool-execution";
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
  const isMobile = useIsMobile();

  const executeFormBasedTool = useCallback(
    async (inputText: string, opts?: Record<string, unknown>) => {
      let structuredInput: Record<string, unknown>;
      try {
        structuredInput = JSON.parse(inputText) as Record<string, unknown>;
      } catch {
        structuredInput = {};
      }

      // All tools run client-side in the browser
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
    [tool.id]
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
    const structuredInput = buildStructuredInput();
    const inputJson = JSON.stringify(structuredInput);
    void execute(inputJson, options);
  }, [buildStructuredInput, options, execute]);

  // Store latest values in refs to avoid re-render loop
  const handleFormBasedExecuteRef = useRef(handleFormBasedExecute);
  const resetRef = useRef(reset);
  handleFormBasedExecuteRef.current = handleFormBasedExecute;
  resetRef.current = reset;

  const stableExecute = useCallback(() => {
    handleFormBasedExecuteRef.current();
  }, []);

  const stableReset = useCallback(() => {
    resetRef.current();
  }, []);

  useEffect(() => {
    onExecuteReady({
      execute: stableExecute,
      reset: stableReset,
      isExecuting,
      isDebouncing: false,
      hasInput: true,
    });
  }, [isExecuting, onExecuteReady, stableExecute, stableReset]);

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
          isExecuting={isExecuting}
          toolName={tool.name}
        />
        <OutputPanel
          result={result}
          rendererType={ui.outputRenderer}
          language={ui.outputLanguage ?? ui.inputLanguage}
          isLoading={isExecuting}
          isAutoMode={false}
          downloadFilename={`${tool.name.toLowerCase().replace(/\s+/g, "-")}-output-${Date.now()}${getFileExtension(ui.outputLanguage ?? ui.inputLanguage)}`}
          onCopy={onCopy}
        />
      </ToolLayout>
    </div>
  );
}
