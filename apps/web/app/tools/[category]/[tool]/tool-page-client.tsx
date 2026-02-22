"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Play, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type {
  ToolMeta,
  ToolUIConfig,
  ToolExample,
} from "@utils-live/tools/constants";
import { DIFF_TOOL_PATTERNS, ToolTier } from "@utils-live/tools/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolOptions } from "@/components/tools/tool-options";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToolDocumentation } from "@/components/tools/tool-documentation";
import { RelatedTools } from "@/components/tools/related-tools";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import type { ToolCardData } from "@/lib/tools/get-tool";
import { cn } from "@/lib/utils";
import {
  StandardToolLayout,
  DiffToolLayout,
  GeneratorToolLayout,
  getToolVariant,
} from "./layouts";
import type { FormattedSchema } from "./layouts";
import { getSampleData } from "./layouts/utils";

interface ToolPageClientProps {
  tool: ToolMeta;
  ui: ToolUIConfig;
  inputSchema: Record<string, unknown>;
  optionsSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  relatedTools: ToolCardData[];
  examples: ToolExample[];
}

export function ToolPageClient({
  tool,
  ui,
  inputSchema,
  optionsSchema,
  outputSchema: _outputSchema,
  relatedTools,
  examples,
}: ToolPageClientProps): React.ReactElement {
  // Determine tool variant
  const variant = useMemo(
    () => getToolVariant(tool, inputSchema, DIFF_TOOL_PATTERNS),
    [tool, inputSchema]
  );

  // Options state (shared across all variants)
  const [options, setOptions] = useState<Record<string, unknown>>({});

  // Generator-specific input values
  const [generatorInputValues, setGeneratorInputValues] = useState<
    Record<string, unknown>
  >({});

  // Example input state (set when user clicks "Load Example")
  // Counter ensures useEffect fires even when the same example is loaded twice.
  const [exampleInput, setExampleInput] = useState<{
    value: string;
    seq: number;
  }>({ value: "", seq: 0 });

  // Storage keys (must be declared before callbacks that reference them)
  const optionsStorageKey = useMemo(
    () => `utils.live:tool-options:${tool.id}`,
    [tool.id]
  );
  const inputStorageKey = useMemo(
    () => `utils.live:tool-input-values:${tool.id}`,
    [tool.id]
  );

  // Pending generator example: when set, a useEffect applies values and triggers execution
  const [pendingGeneratorExample, setPendingGeneratorExample] = useState<{
    values: Record<string, unknown>;
    seq: number;
  }>({ values: {}, seq: 0 });

  // Handler for loading an example into the editor
  const handleLoadExample = useCallback(
    (example: {
      input: string | Record<string, unknown>;
      options?: Record<string, unknown>;
    }) => {
      if (example.options) {
        setOptions(example.options);
        try {
          localStorage.setItem(
            optionsStorageKey,
            JSON.stringify(example.options)
          );
        } catch {
          // localStorage unavailable - ignore
        }
      }

      // Generator tools: load values into form fields via state
      if (variant === "generator") {
        let values: Record<string, unknown>;
        if (typeof example.input === "object" && example.input !== null) {
          values = example.input;
        } else {
          // String input: map to the first string property in the input schema
          const properties = (inputSchema.properties ?? {}) as Record<
            string,
            Record<string, unknown>
          >;
          const firstStringKey = Object.entries(properties).find(
            ([, prop]) => prop.type === "string"
          )?.[0];
          values = firstStringKey ? { [firstStringKey]: example.input } : {};
        }
        setGeneratorInputValues(values);
        try {
          localStorage.setItem(inputStorageKey, JSON.stringify(values));
        } catch {
          // localStorage unavailable - ignore
        }
        setPendingGeneratorExample((prev) => ({ values, seq: prev.seq + 1 }));
        return;
      }

      // Standard / diff: load into editor
      let inputStr: string;
      if (typeof example.input === "string") {
        inputStr = example.input;
      } else if (
        variant === "standard" &&
        typeof example.input === "object" &&
        example.input !== null &&
        "input" in example.input &&
        typeof example.input.input === "string"
      ) {
        // Standard layout: the editor takes a raw string that gets wrapped
        // as { input: editorContent } during execution, so extract just the
        // inner value to avoid double-nesting.
        inputStr = example.input.input;
      } else {
        inputStr = JSON.stringify(example.input, null, 2);
      }
      setExampleInput((prev) => ({ value: inputStr, seq: prev.seq + 1 }));
    },
    [optionsStorageKey, inputStorageKey, variant, inputSchema]
  );

  // Child layout execution state
  const executeFnRef = useRef<() => void>(() => {});
  const resetFnRef = useRef<() => void>(() => {});
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [hasInput, setHasInput] = useState(false);

  // Guard against setState before mount (child useEffect can fire during hydration)
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleExecuteReady = useCallback(
    (fns: {
      execute: () => void;
      reset: () => void;
      isExecuting: boolean;
      isDebouncing: boolean;
      hasInput: boolean;
    }) => {
      executeFnRef.current = fns.execute;
      resetFnRef.current = fns.reset;
      if (mountedRef.current) {
        setIsExecuting(fns.isExecuting);
        setIsDebouncing(fns.isDebouncing);
        setHasInput(fns.hasInput);
      }
    },
    []
  );

  // Auto-execute after generator example is loaded
  const pendingExampleSeqRef = useRef(0);
  useEffect(() => {
    if (pendingGeneratorExample.seq === 0) return;
    if (pendingGeneratorExample.seq === pendingExampleSeqRef.current) return;
    pendingExampleSeqRef.current = pendingGeneratorExample.seq;
    // Trigger execution after React processes the state update
    requestAnimationFrame(() => {
      executeFnRef.current();
    });
  }, [pendingGeneratorExample]);

  // Coerce saved option values to match JSON Schema types.
  // Needed because older versions may have stored numbers as strings.
  const coerceOptions = useCallback(
    (raw: Record<string, unknown>): Record<string, unknown> => {
      const props = (
        optionsSchema as { properties?: Record<string, { type?: string }> }
      ).properties;
      if (!props) return raw;
      const coerced = { ...raw };
      for (const [key, value] of Object.entries(coerced)) {
        const fieldType = props[key]?.type;
        if (
          (fieldType === "number" || fieldType === "integer") &&
          typeof value === "string"
        ) {
          const num = Number(value);
          if (!isNaN(num)) coerced[key] = num;
        } else if (fieldType === "boolean" && typeof value === "string") {
          coerced[key] = value === "true";
        }
      }
      return coerced;
    },
    [optionsSchema]
  );

  // Load saved options from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(optionsStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, unknown>;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initializing from localStorage
        setOptions(coerceOptions(parsed));
      }
    } catch {
      // localStorage unavailable or corrupted data - ignore
    }
    if (variant === "generator") {
      try {
        const savedInputs = localStorage.getItem(inputStorageKey);
        if (savedInputs) {
          const parsed = JSON.parse(savedInputs) as Record<string, unknown>;
          setGeneratorInputValues(parsed);
        }
      } catch {
        // localStorage unavailable or corrupted data - ignore
      }
    }
  }, [optionsStorageKey, inputStorageKey, variant, coerceOptions]);

  // Persist options to localStorage
  const handleOptionsChange = useCallback(
    (newOptions: Record<string, unknown>) => {
      setOptions(newOptions);
      try {
        localStorage.setItem(optionsStorageKey, JSON.stringify(newOptions));
      } catch {
        // localStorage unavailable or full - ignore
      }
    },
    [optionsStorageKey]
  );

  // Persist generator input values to localStorage
  const handleGeneratorInputChange = useCallback(
    (newValues: Record<string, unknown>) => {
      setGeneratorInputValues(newValues);
      try {
        localStorage.setItem(inputStorageKey, JSON.stringify(newValues));
      } catch {
        // localStorage unavailable or full - ignore
      }
    },
    [inputStorageKey]
  );

  // Reset options to defaults
  const handleResetOptions = useCallback(() => {
    setOptions({});
    try {
      localStorage.removeItem(optionsStorageKey);
    } catch {
      // localStorage unavailable - ignore
    }
  }, [optionsStorageKey]);

  // Manual execute handler
  const handleExecute = useCallback(() => {
    executeFnRef.current();
  }, []);

  // Keyboard shortcut: Ctrl+Enter to execute
  useKeyboardShortcut(
    ["ctrl", "Enter"],
    () => {
      handleExecute();
    },
    { preventDefault: true }
  );

  // Keyboard shortcut: Escape to clear
  useKeyboardShortcut(
    ["Escape"],
    () => {
      resetFnRef.current();
    },
    { preventDefault: false }
  );

  // Options schema formatting
  const optionsSchemaFormatted = optionsSchema as unknown as FormattedSchema;

  const hasOptions =
    optionsSchemaFormatted?.properties &&
    Object.keys(optionsSchemaFormatted.properties).length > 0;

  const optionsCount = hasOptions
    ? Object.keys(optionsSchemaFormatted.properties).length
    : 0;

  const [optionsOpen, setOptionsOpen] = useState(() => optionsCount <= 3);

  // Determine mobile tab labels
  const { inputLabel, outputLabel } = useMemo(() => {
    if (variant === "generator") {
      return { inputLabel: "Configure", outputLabel: "Output" };
    }

    const renderer = ui.outputRenderer;
    const name = tool.name.toLowerCase();

    if (
      renderer === "html" ||
      renderer === "markdown" ||
      renderer === "image" ||
      renderer === "diagram"
    ) {
      return { inputLabel: "Edit", outputLabel: "Preview" };
    }

    if (
      name.includes("convert") ||
      name.includes("to ") ||
      name.includes("transform")
    ) {
      return { inputLabel: "Source", outputLabel: "Converted" };
    }

    return { inputLabel: "Input", outputLabel: "Output" };
  }, [ui.outputRenderer, tool.name, variant]);

  // Detect platform for shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    // Use userAgentData when available, fall back to userAgent string
    if ("userAgentData" in navigator && navigator.userAgentData) {
      return (
        (navigator.userAgentData as { platform: string }).platform === "macOS"
      );
    }
    return /mac/i.test(navigator.userAgent);
  }, []);

  const modKey = isMac ? "\u2318" : "Ctrl";

  // Compute sample data: prefer first example's input, fall back to generic category data
  const sampleInput = useMemo(() => {
    if (examples.length > 0) {
      const firstInput = examples[0]!.input;
      return typeof firstInput === "string"
        ? firstInput
        : JSON.stringify(firstInput, null, 2);
    }
    return getSampleData(ui.inputLanguage, tool.category);
  }, [examples, ui.inputLanguage, tool.category]);

  // Memoize mapped related tools to avoid recreating objects array on every render
  const mappedRelatedTools = useMemo(
    () =>
      relatedTools.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
      })),
    [relatedTools]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        {/* Auto-execute indicator for client-tier non-form-based tools */}
        {tool.tier === ToolTier.CLIENT && variant !== "generator" && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 text-xs"
              title="This tool executes automatically as you type"
            >
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  isDebouncing
                    ? "animate-pulse bg-yellow-500"
                    : isExecuting
                      ? "animate-pulse bg-blue-500"
                      : "bg-green-500"
                )}
                aria-hidden="true"
              />
              Auto
              <span className="sr-only">
                {isDebouncing
                  ? " - waiting for input"
                  : isExecuting
                    ? " - executing"
                    : " - ready"}
              </span>
            </Badge>
          </div>
        )}
        {tool.tier !== ToolTier.CLIENT && variant !== "generator" && (
          <Button
            onClick={handleExecute}
            disabled={isExecuting || !hasInput}
            title={`Execute (${modKey}+Enter)`}
          >
            <Play className="mr-2 h-4 w-4" />
            {isExecuting ? "Executing..." : "Execute"}
            <span className="text-muted-foreground ml-1 text-xs opacity-70">
              {modKey}+Enter
            </span>
          </Button>
        )}
      </div>

      {/* Main tool layout - variant-specific */}
      {variant === "diff" && (
        <DiffToolLayout
          tool={tool}
          ui={ui}
          options={options}
          exampleInput={exampleInput.value}
          exampleInputSeq={exampleInput.seq}
          onExecuteReady={handleExecuteReady}
        />
      )}
      {variant === "generator" && (
        <GeneratorToolLayout
          tool={tool}
          ui={ui}
          inputSchema={inputSchema}
          optionsSchema={optionsSchema}
          options={options}
          onOptionsChange={handleOptionsChange}
          generatorInputValues={generatorInputValues}
          onGeneratorInputChange={handleGeneratorInputChange}
          onExecuteReady={handleExecuteReady}
        />
      )}
      {variant === "standard" && (
        <StandardToolLayout
          tool={tool}
          ui={ui}
          options={options}
          inputLabel={inputLabel}
          outputLabel={outputLabel}
          exampleInput={exampleInput.value}
          exampleInputSeq={exampleInput.seq}
          sampleData={sampleInput}
          onExecuteReady={handleExecuteReady}
        />
      )}

      {/* Options section - only show for non-generator tools */}
      {hasOptions && variant !== "generator" && (
        <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
          <div className="rounded-lg border">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 transition-colors"
              >
                <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  Options
                  <span className="text-muted-foreground/60 text-xs">
                    ({optionsCount})
                  </span>
                </span>
                {optionsOpen ? (
                  <ChevronUp className="text-muted-foreground h-4 w-4" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border-t px-4 pt-2 pb-4">
                <div className="mb-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetOptions}
                    disabled={isExecuting || Object.keys(options).length === 0}
                    className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
                    aria-label="Reset options to defaults"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to defaults
                  </Button>
                </div>
                <ToolOptions
                  schema={optionsSchemaFormatted}
                  values={options}
                  onChange={handleOptionsChange}
                  disabled={isExecuting}
                  showHeader={false}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Documentation section */}
      <ToolDocumentation
        name={tool.name}
        description={tool.description}
        category={tool.category}
        examples={examples}
        onLoadExample={handleLoadExample}
        inputLanguage={ui.inputLanguage}
        outputLanguage={ui.outputLanguage}
      />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <RelatedTools currentToolId={tool.id} tools={mappedRelatedTools} />
      )}
    </div>
  );
}
