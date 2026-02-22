"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ToolMeta, ToolUIConfig } from "@utils-live/tools/constants";
import { ToolTier } from "@utils-live/tools/constants";
import { ToolLayout } from "@/components/tools/tool-layout";
import { InputPanel } from "@/components/editor/input-panel";
import { OutputPanel } from "@/components/editor/output-panel";
import { AIOutputPanel } from "@/components/tools/ai-output-panel";
import { useToolExecution } from "@/hooks/use-tool-execution";
import { useAIStreaming } from "@/hooks/use-ai-streaming";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { getFileExtension, getSampleData } from "./utils";

interface StandardToolLayoutProps {
  tool: ToolMeta;
  ui: ToolUIConfig;
  options: Record<string, unknown>;
  inputLabel: string;
  outputLabel: string;
  exampleInput?: string;
  exampleInputSeq?: number;
  sampleData?: string;
  onExecuteReady: (fns: {
    execute: () => void;
    reset: () => void;
    isExecuting: boolean;
    isDebouncing: boolean;
    hasInput: boolean;
  }) => void;
}

export function StandardToolLayout({
  tool,
  ui,
  options,
  inputLabel,
  outputLabel,
  exampleInput,
  exampleInputSeq,
  sampleData: sampleDataProp,
  onExecuteReady,
}: StandardToolLayoutProps): React.ReactElement {
  const isAI = tool.tier === ToolTier.AI;
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");

  // Load example input when provided.
  // exampleInputSeq changes on every click so the effect re-fires even for the
  // same example content (e.g. user modifies input then clicks Load Example again).
  useEffect(() => {
    if (exampleInput !== undefined && exampleInput !== "") {
      setInput(exampleInput);
    }
  }, [exampleInput, exampleInputSeq]);

  const debouncedInput = useDebounce(input, 300);

  // --- AI streaming hook (only active for AI-tier tools) ---
  const aiStreaming = useAIStreaming();

  // --- Regular tool execution (non-AI tools) ---
  const executeRegularTool = useCallback(
    async (inputText: string, opts?: Record<string, unknown>) => {
      // Server-tier tools must be executed on the server via the API route
      if (
        tool.tier === ("server-light" as ToolTier) ||
        tool.tier === ("server-heavy" as ToolTier)
      ) {
        const response = await fetch(`/api/tools/${tool.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: { input: inputText }, options: opts }),
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

      const result = await executeTool(
        toolInstance,
        { input: inputText },
        opts
      );

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
    executeRegularTool
  );

  // Track debounce state
  const isDebouncing =
    tool.tier === ToolTier.CLIENT &&
    input.trim() !== "" &&
    input !== debouncedInput;

  // Auto-execute on input change for client-tier tools
  useEffect(() => {
    if (tool.tier === ToolTier.CLIENT && debouncedInput.trim()) {
      void execute(debouncedInput, options);
    }
  }, [debouncedInput, options, tool.tier, execute]);

  // Store latest values in refs to avoid re-render loop
  const inputRef = useRef(input);
  const optionsRef = useRef(options);
  const executeRef = useRef(execute);
  const resetRef = useRef(reset);
  const aiStreamingRef = useRef(aiStreaming);
  inputRef.current = input;
  optionsRef.current = options;
  executeRef.current = execute;
  resetRef.current = reset;
  aiStreamingRef.current = aiStreaming;

  const stableExecute = useCallback(() => {
    if (!inputRef.current.trim()) return;

    if (isAI) {
      aiStreamingRef.current.startStream(
        tool.id,
        { input: inputRef.current },
        optionsRef.current
      );
    } else {
      void executeRef.current(inputRef.current, optionsRef.current);
    }
  }, [isAI, tool.id]);

  const stableReset = useCallback(() => {
    setInput("");
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
      isDebouncing,
      hasInput: input.trim() !== "",
    });
  }, [
    isProcessing,
    isDebouncing,
    input,
    onExecuteReady,
    stableExecute,
    stableReset,
  ]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (!value.trim()) {
        if (isAI) {
          aiStreaming.reset();
        } else {
          reset();
        }
      }
    },
    [isAI, aiStreaming, reset]
  );

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
        inputLabel={inputLabel}
        outputLabel={outputLabel}
      >
        <InputPanel
          value={input}
          onChange={handleInputChange}
          language={ui.inputLanguage}
          placeholder={`Enter ${tool.name.toLowerCase()} input...`}
          allowFileUpload={ui.allowFileUpload}
          acceptedFileTypes={ui.acceptedFileTypes}
          maxFileSize={ui.maxFileSize}
          sampleData={
            sampleDataProp ?? getSampleData(ui.inputLanguage, tool.category)
          }
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
          />
        )}
      </ToolLayout>
    </div>
  );
}
