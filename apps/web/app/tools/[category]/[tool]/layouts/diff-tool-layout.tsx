"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ToolMeta, ToolUIConfig } from "@utils-live/tools/constants";
import { ToolTier } from "@utils-live/tools/constants";
import { DualInputLayout } from "@/components/tools/dual-input-layout";
import { OutputPanel } from "@/components/editor/output-panel";
import { useToolExecution } from "@/hooks/use-tool-execution";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { getFileExtension } from "./utils";

interface DiffToolLayoutProps {
  tool: ToolMeta;
  ui: ToolUIConfig;
  options: Record<string, unknown>;
  exampleInput?: string;
  exampleInputSeq?: number;
  onCopy?: () => void;
  onExecuteReady: (fns: {
    execute: () => void;
    reset: () => void;
    isExecuting: boolean;
    isDebouncing: boolean;
    hasInput: boolean;
  }) => void;
}

export function DiffToolLayout({
  tool,
  ui,
  options,
  exampleInput,
  exampleInputSeq,
  onCopy,
  onExecuteReady,
}: DiffToolLayoutProps): React.ReactElement {
  const isMobile = useIsMobile();
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");

  const debouncedInput1 = useDebounce(input1, 300);
  const debouncedInput2 = useDebounce(input2, 300);

  // Load example input when user clicks "Load Example"
  const prevExampleSeqRef = useRef(0);
  useEffect(() => {
    if (
      !exampleInput ||
      !exampleInputSeq ||
      exampleInputSeq === prevExampleSeqRef.current
    )
      return;
    prevExampleSeqRef.current = exampleInputSeq;
    try {
      const parsed = JSON.parse(exampleInput) as Record<string, unknown>;
      if (typeof parsed.input1 === "string") {
        setInput1(parsed.input1);
      }
      if (typeof parsed.input2 === "string") {
        setInput2(parsed.input2);
      }
    } catch {
      // If not JSON, set as input1
      setInput1(exampleInput);
    }
  }, [exampleInput, exampleInputSeq]);

  const executeDiffTool = useCallback(
    async (inputText: string, opts?: Record<string, unknown>) => {
      const { getToolById, executeTool } = await import("@utils-live/tools");
      const toolInstance = getToolById(tool.id);

      if (!toolInstance) {
        throw new Error(`Tool ${tool.id} not found`);
      }

      const parsed = JSON.parse(inputText) as {
        input1: string;
        input2: string;
      };

      let dualInput: Record<string, string>;
      const shape = (
        toolInstance.inputSchema as { shape?: Record<string, unknown> }
      )?.shape;
      if (shape && !("input1" in shape) && "input" in shape) {
        const fieldNames = Object.keys(shape);
        const secondField = fieldNames.find((k) => k !== "input") ?? "second";
        dualInput = { input: parsed.input1, [secondField]: parsed.input2 };
      } else {
        dualInput = { input1: parsed.input1, input2: parsed.input2 };
      }

      const result = await executeTool(toolInstance, dualInput, opts);

      if (!result.success) {
        throw new Error(result.error?.message ?? "Tool execution failed");
      }

      const data = result.data as Record<string, unknown>;

      // For diff renderer, return structured data so DiffViewer gets original/modified
      if (ui.outputRenderer === "diff") {
        return data;
      }

      if (typeof data.output === "string") return data.output;
      if (data.output !== undefined) return JSON.stringify(data.output);
      if (typeof data.markdown === "string") return data.markdown;
      return JSON.stringify(data, null, 2);
    },
    [tool.id, ui.outputRenderer]
  );

  const { result, isExecuting, execute, reset } = useToolExecution(
    tool.id,
    executeDiffTool
  );

  // Track debounce state
  const isDebouncing =
    tool.tier === ToolTier.CLIENT &&
    (input1.trim() !== "" || input2.trim() !== "") &&
    (input1 !== debouncedInput1 || input2 !== debouncedInput2);

  // Auto-execute on input change for client-tier tools
  useEffect(() => {
    if (
      tool.tier === ToolTier.CLIENT &&
      debouncedInput1.trim() &&
      debouncedInput2.trim()
    ) {
      const combined = JSON.stringify({
        input1: debouncedInput1,
        input2: debouncedInput2,
      });
      void execute(combined, options);
    }
  }, [debouncedInput1, debouncedInput2, options, tool.tier, execute]);

  // Store latest values in refs to avoid re-render loop
  const input1Ref = useRef(input1);
  const input2Ref = useRef(input2);
  const optionsRef = useRef(options);
  const executeRef = useRef(execute);
  const resetRef = useRef(reset);
  input1Ref.current = input1;
  input2Ref.current = input2;
  optionsRef.current = options;
  executeRef.current = execute;
  resetRef.current = reset;

  const stableExecute = useCallback(() => {
    if (input1Ref.current.trim() && input2Ref.current.trim()) {
      const combined = JSON.stringify({
        input1: input1Ref.current,
        input2: input2Ref.current,
      });
      void executeRef.current(combined, optionsRef.current);
    }
  }, []);

  const stableReset = useCallback(() => {
    setInput1("");
    setInput2("");
    resetRef.current();
  }, []);

  // Report execution state to parent
  useEffect(() => {
    onExecuteReady({
      execute: stableExecute,
      reset: stableReset,
      isExecuting,
      isDebouncing,
      hasInput: input1.trim() !== "" && input2.trim() !== "",
    });
  }, [
    isExecuting,
    isDebouncing,
    input1,
    input2,
    onExecuteReady,
    stableExecute,
    stableReset,
  ]);

  const handleInput1Change = useCallback(
    (value: string) => {
      setInput1(value);
      if (!value.trim() && !input2.trim()) {
        reset();
      }
    },
    [input2, reset]
  );

  const handleInput2Change = useCallback(
    (value: string) => {
      setInput2(value);
      if (!value.trim() && !input1.trim()) {
        reset();
      }
    },
    [input1, reset]
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "min-h-[250px]",
          isMobile
            ? "h-[35vh] max-h-[400px]"
            : "h-[calc(50vh-200px)] max-h-[400px]"
        )}
      >
        <DualInputLayout
          originalValue={input1}
          modifiedValue={input2}
          onOriginalChange={handleInput1Change}
          onModifiedChange={handleInput2Change}
          language={ui.inputLanguage}
          allowFileUpload={ui.allowFileUpload}
          acceptedFileTypes={ui.acceptedFileTypes}
          maxFileSize={ui.maxFileSize}
          disabled={isExecuting}
        />
      </div>

      <div
        className={cn(
          "min-h-[200px]",
          isMobile
            ? "h-[30vh] max-h-[350px]"
            : "h-[calc(50vh-200px)] max-h-[400px]"
        )}
      >
        <OutputPanel
          result={result}
          rendererType={ui.outputRenderer}
          language={ui.outputLanguage ?? ui.inputLanguage}
          isLoading={isExecuting}
          isAutoMode={tool.tier === ToolTier.CLIENT}
          downloadFilename={`${tool.name.toLowerCase().replace(/\s+/g, "-")}-output-${Date.now()}${getFileExtension(ui.outputLanguage ?? ui.inputLanguage)}`}
          onCopy={onCopy}
        />
      </div>
    </div>
  );
}
