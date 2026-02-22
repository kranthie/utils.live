"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Square, Clock, CheckCircle, AlertCircle, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";
import { ErrorDisplay } from "@/components/display/error-display";
import { EmptyState } from "@/components/display/empty-state";
import { EditorFallback } from "@/components/editor/editor-fallback";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

// Lazy load Monaco Editor for the Raw view
const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((mod) => mod.CodeEditor),
  {
    loading: () => (
      <EditorFallback value="" placeholder="Loading editor..." readOnly />
    ),
    ssr: false,
  }
);

// Lazy load MarkdownPreview for the Preview view
const MarkdownPreview = dynamic(
  () =>
    import("@/components/renderers/markdown-preview").then(
      (mod) => mod.MarkdownPreview
    ),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center p-6">
        <span className="text-muted-foreground text-sm">
          Loading preview...
        </span>
      </div>
    ),
    ssr: false,
  }
);

type ViewMode = "preview" | "raw";

interface AIOutputPanelProps {
  /** Accumulated streamed content */
  content: string;
  /** Whether stream is active */
  isStreaming: boolean;
  /** Whether stream finished */
  isComplete: boolean;
  /** Error message if failed */
  error: string | null;
  /** Elapsed time in milliseconds */
  elapsed?: number;
  /** Callback to abort the stream */
  onAbort?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function AIOutputPanel({
  content,
  isStreaming,
  isComplete,
  error,
  elapsed = 0,
  onAbort,
  className,
}: AIOutputPanelProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  // Content with streaming cursor
  const displayContent = useMemo(() => {
    if (isStreaming && content) {
      return content + "\u258D"; // ▍ blinking block cursor
    }
    return content;
  }, [content, isStreaming]);

  // Accessible status announcements — derived, not stateful
  const statusAnnouncement = useMemo(() => {
    if (isStreaming) return "AI is generating a response...";
    if (isComplete) {
      const timeStr = elapsed > 0 ? ` Completed in ${formatDuration(elapsed)}.` : "";
      return `AI response complete.${timeStr}`;
    }
    if (error) return `AI response failed: ${error}`;
    return "";
  }, [isStreaming, isComplete, error, elapsed]);

  const hasContent = Boolean(content) || isStreaming;

  const renderStatus = (): React.ReactElement | null => {
    if (isStreaming) {
      return (
        <span className="output-status output-status-loading">
          <Clock className="h-3 w-3" />
          Streaming...
          {elapsed > 0 && (
            <span className="text-muted-foreground">
              ({formatDuration(elapsed)})
            </span>
          )}
        </span>
      );
    }

    if (error) {
      return (
        <span className="output-status output-status-error">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
    }

    if (isComplete) {
      return (
        <span className="output-status output-status-success">
          <CheckCircle className="h-3 w-3" />
          Complete
          {elapsed > 0 && (
            <span className="text-muted-foreground">
              ({formatDuration(elapsed)})
            </span>
          )}
        </span>
      );
    }

    return null;
  };

  const renderContent = (): React.ReactElement => {
    // Error state
    if (error) {
      return (
        <div className="p-4">
          <ErrorDisplay
            type="error"
            title="AI Execution Error"
            message={error}
          />
        </div>
      );
    }

    // No content and not streaming
    if (!content && !isStreaming) {
      return (
        <EmptyState
          icon={<FileCode className="text-muted-foreground/30 h-12 w-12" />}
          title="No output yet"
          description="Enter input and click Execute to generate an AI response"
          size="default"
        />
      );
    }

    // Streaming with no content yet (initial loading)
    if (!content && isStreaming) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 animate-pulse" />
              Waiting for AI response...
            </div>
            <span className="text-2xl animate-pulse">{"\u258D"}</span>
          </div>
        </div>
      );
    }

    // Content available — render based on viewMode
    if (viewMode === "raw") {
      return <CodeEditor value={content} language="plaintext" readOnly />;
    }

    return (
      <div className="h-full overflow-auto p-6">
        <MarkdownPreview content={displayContent} showCodeCopy />
      </div>
    );
  };

  return (
    <div className={cn("editor-wrapper", className)}>
      {/* Header */}
      <div className="editor-header">
        <div className="flex items-center gap-2">
          <span className="editor-header-title">Output</span>
          {renderStatus()}
        </div>
        <div className="editor-header-actions">
          {isStreaming && onAbort && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onAbort}
              className="h-7 gap-1.5 px-2.5 text-xs"
            >
              <Square className="h-3 w-3" />
              Stop
            </Button>
          )}
          {hasContent && !error && (
            <div
              role="radiogroup"
              aria-label="Output view mode"
              className="bg-muted inline-flex h-7 items-center rounded-md p-0.5"
            >
              <button
                role="radio"
                aria-checked={viewMode === "preview"}
                onClick={() => setViewMode("preview")}
                className={cn(
                  "inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "preview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Preview
              </button>
              <button
                role="radio"
                aria-checked={viewMode === "raw"}
                onClick={() => setViewMode("raw")}
                className={cn(
                  "inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "raw"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Raw
              </button>
            </div>
          )}
          {content && !isStreaming && (
            <CopyButton value={content} size="sm" />
          )}
        </div>
      </div>

      {/* Accessible status announcements */}
      <div aria-live="polite" aria-atomic="true" role="status">
        <span className="sr-only">{statusAnnouncement}</span>
      </div>

      {/* Content */}
      <div className="editor-content">{renderContent()}</div>
    </div>
  );
}
