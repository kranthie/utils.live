"use client";

import { useRef, useCallback, useMemo } from "react";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import "@/styles/editor.css";

type MonacoInstance = Parameters<OnMount>[1];

interface CodeEditorProps {
  /**
   * The current value of the editor
   */
  value: string;
  /**
   * Callback when the value changes
   */
  onChange?: (value: string) => void;
  /**
   * The language for syntax highlighting
   * @default "plaintext"
   */
  language?: string;
  /**
   * Placeholder text shown when editor is empty
   */
  placeholder?: string;
  /**
   * Whether the editor is read-only
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether to show line numbers
   * @default true
   */
  lineNumbers?: boolean;
  /**
   * Whether to show the minimap
   * @default false
   */
  minimap?: boolean;
  /**
   * Word wrap mode
   * @default "on"
   */
  wordWrap?: "on" | "off" | "wordWrapColumn" | "bounded";
  /**
   * Font size in pixels
   * @default 14
   */
  fontSize?: number;
  /**
   * Tab size
   * @default 2
   */
  tabSize?: number;
  /**
   * Minimum height of the editor
   * @default "200px"
   */
  minHeight?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Callback when editor mounts
   */
  onMount?: OnMount;
}

export function CodeEditor({
  value,
  onChange,
  language = "plaintext",
  placeholder,
  readOnly = false,
  lineNumbers = true,
  minimap = false,
  wordWrap = "on",
  fontSize = 14,
  tabSize = 2,
  minHeight = "200px",
  className,
  onMount,
}: CodeEditorProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = useCallback(
    (
      editorInstance: editor.IStandaloneCodeEditor,
      monaco: MonacoInstance
    ): void => {
      editorRef.current = editorInstance;

      // Configure editor
      editorInstance.updateOptions({
        scrollBeyondLastLine: false,
        automaticLayout: true,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      });

      // Add keyboard shortcuts — use monaco instance to avoid importing KeyMod/KeyCode at module level
      editorInstance.addCommand(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- monaco type not fully resolved by ts-eslint
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA,
        (): void => {
          editorInstance.setSelection({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: editorInstance.getModel()?.getLineCount() ?? 1,
            endColumn:
              editorInstance
                .getModel()
                ?.getLineMaxColumn(
                  editorInstance.getModel()?.getLineCount() ?? 1
                ) ?? 1,
          });
        }
      );

      onMount?.(editorInstance, monaco);
    },
    [onMount]
  );

  const handleChange: OnChange = useCallback(
    (value): void => {
      onChange?.(value ?? "");
    },
    [onChange]
  );

  const editorOptions = useMemo(
    () => ({
      readOnly,
      lineNumbers: lineNumbers ? ("on" as const) : ("off" as const),
      minimap: { enabled: minimap },
      wordWrap,
      fontSize,
      tabSize,
      renderLineHighlight: "line" as const,
      renderWhitespace: "selection" as const,
      cursorBlinking: "smooth" as const,
      smoothScrolling: true,
      contextmenu: true,
      folding: true,
      foldingHighlight: true,
      showFoldingControls: "mouseover" as const,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      padding: { top: 8, bottom: 8 },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
    }),
    [readOnly, lineNumbers, minimap, wordWrap, fontSize, tabSize]
  );

  return (
    <div
      className={cn("monaco-editor-container", className)}
      style={{ minHeight }}
      role="region"
      aria-label={placeholder ?? `${language} code editor`}
      aria-roledescription="code editor"
    >
      <Editor
        value={value}
        language={language}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={editorOptions}
        loading={
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-4">
            <Skeleton className="h-full min-h-[200px] w-full" />
            <span className="text-muted-foreground text-sm">
              Loading editor...
            </span>
          </div>
        }
      />
    </div>
  );
}
