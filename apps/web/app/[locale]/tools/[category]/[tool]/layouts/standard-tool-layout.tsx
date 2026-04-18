"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ToolMeta, ToolUIConfig } from "@utils-live/tools/constants";
import { useTranslations } from "next-intl";
import { ToolLayout } from "@/components/tools/tool-layout";
import { InputPanel } from "@/components/editor/input-panel";
import { OutputPanel } from "@/components/editor/output-panel";
import { useToolExecution } from "@/hooks/use-tool-execution";
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
  onCopy?: () => void;
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
  onCopy,
  onExecuteReady,
}: StandardToolLayoutProps): React.ReactElement {
  const t = useTranslations("tools.shell");
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

  // All tools run client-side in the browser
  const executeClientTool = useCallback(
    async (inputText: string, opts?: Record<string, unknown>) => {
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
    [tool.id]
  );

  const { result, isExecuting, execute, reset } = useToolExecution(
    tool.id,
    executeClientTool
  );

  // Track debounce state
  const isDebouncing = input.trim() !== "" && input !== debouncedInput;

  // Auto-execute on input change
  useEffect(() => {
    if (debouncedInput.trim()) {
      void execute(debouncedInput, options);
    }
  }, [debouncedInput, options, execute]);

  // Store latest values in refs to avoid re-render loop
  const inputRef = useRef(input);
  const optionsRef = useRef(options);
  const executeRef = useRef(execute);
  const resetRef = useRef(reset);
  inputRef.current = input;
  optionsRef.current = options;
  executeRef.current = execute;
  resetRef.current = reset;

  const stableExecute = useCallback(() => {
    if (!inputRef.current.trim()) return;
    void executeRef.current(inputRef.current, optionsRef.current);
  }, []);

  const stableReset = useCallback(() => {
    setInput("");
    resetRef.current();
  }, []);

  // Report execution state to parent
  useEffect(() => {
    onExecuteReady({
      execute: stableExecute,
      reset: stableReset,
      isExecuting,
      isDebouncing,
      hasInput: input.trim() !== "",
    });
  }, [
    isExecuting,
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
        reset();
      }
    },
    [reset]
  );

  // Compute the download filename once per result so the timestamp reflects
  // when the output was produced, not when the component last rendered.
  // Intentional dep on `result`: the identity changes each execution, which
  // is when we want a fresh timestamp. `result` isn't otherwise read here.
  const downloadFilename = useMemo(() => {
    void result;
    const slug = tool.name.toLowerCase().replace(/\s+/g, "-");
    const ext = getFileExtension(ui.outputLanguage ?? ui.inputLanguage);
    return `${slug}-output-${Date.now()}${ext}`;
  }, [tool.name, ui.outputLanguage, ui.inputLanguage, result]);

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
          placeholder={t("inputPlaceholder", {
            toolName: tool.name.toLowerCase(),
          })}
          allowFileUpload={ui.allowFileUpload}
          acceptedFileTypes={ui.acceptedFileTypes}
          maxFileSize={ui.maxFileSize}
          sampleData={
            sampleDataProp ?? getSampleData(ui.inputLanguage, tool.category)
          }
        />
        <OutputPanel
          result={result}
          rendererType={ui.outputRenderer}
          language={ui.outputLanguage ?? ui.inputLanguage}
          isLoading={isExecuting}
          isAutoMode
          htmlPreviewAllowScripts={ui.htmlPreviewAllowScripts}
          downloadFilename={downloadFilename}
          onCopy={onCopy}
        />
      </ToolLayout>
    </div>
  );
}
