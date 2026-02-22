"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { CheckCircle, XCircle, Clock, FileCode } from "lucide-react";
import { EditorFallback } from "./editor-fallback";
import { CopyButton } from "@/components/shared/copy-button";
import { DownloadButton } from "@/components/shared/download-button";
import { LoadingSpinner } from "@/components/display/loading-spinner";
import { ErrorDisplay } from "@/components/display/error-display";
import { EmptyState } from "@/components/display/empty-state";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";

// Lazy load Monaco Editor
const CodeEditor = dynamic(
  () => import("./code-editor").then((mod) => mod.CodeEditor),
  {
    loading: () => (
      <EditorFallback value="" placeholder="Loading editor..." readOnly />
    ),
    ssr: false,
  }
);

// Lazy load specialized renderers
const DiffViewer = dynamic(
  () =>
    import("@/components/renderers/diff-viewer").then((mod) => mod.DiffViewer),
  {
    loading: () => <LoadingSpinner label="Loading diff viewer..." />,
    ssr: false,
  }
);

const JsonTree = dynamic(
  () => import("@/components/renderers/json-tree").then((mod) => mod.JsonTree),
  {
    loading: () => <LoadingSpinner label="Loading JSON viewer..." />,
    ssr: false,
  }
);

const MarkdownPreview = dynamic(
  () =>
    import("@/components/renderers/markdown-preview").then(
      (mod) => mod.MarkdownPreview
    ),
  {
    loading: () => <LoadingSpinner label="Loading markdown preview..." />,
    ssr: false,
  }
);

const TableViewer = dynamic(
  () =>
    import("@/components/renderers/table-viewer").then(
      (mod) => mod.TableViewer
    ),
  { loading: () => <LoadingSpinner label="Loading table..." />, ssr: false }
);

const HtmlPreview = dynamic(
  () =>
    import("@/components/renderers/html-preview").then(
      (mod) => mod.HtmlPreview
    ),
  {
    loading: () => <LoadingSpinner label="Loading HTML preview..." />,
    ssr: false,
  }
);

const MermaidRenderer = dynamic(
  () =>
    import("@/components/renderers/mermaid-renderer").then(
      (mod) => mod.MermaidRenderer
    ),
  { loading: () => <LoadingSpinner label="Loading diagram..." />, ssr: false }
);

const ImagePreview = dynamic(
  () =>
    import("@/components/renderers/image-preview").then(
      (mod) => mod.ImagePreview
    ),
  {
    loading: () => <LoadingSpinner label="Loading image preview..." />,
    ssr: false,
  }
);

const ColorSwatch = dynamic(
  () =>
    import("@/components/renderers/color-swatch").then(
      (mod) => mod.ColorSwatch
    ),
  { loading: () => <LoadingSpinner label="Loading color..." />, ssr: false }
);

const ColorPalette = dynamic(
  () =>
    import("@/components/renderers/color-swatch").then(
      (mod) => mod.ColorPalette
    ),
  { loading: () => <LoadingSpinner label="Loading colors..." />, ssr: false }
);

export type OutputRendererType =
  | "code"
  | "diff"
  | "json-tree"
  | "markdown"
  | "table"
  | "html"
  | "image"
  | "color"
  | "color-palette"
  | "diagram";

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: {
      line?: number;
      column?: number;
      path?: string;
    };
  };
  metadata?: {
    executionTime: number;
    inputSize: number;
    outputSize: number;
  };
}

// Type for diff output
interface DiffOutput {
  original: string;
  modified: string;
}

// Type for table output
interface TableOutput {
  columns: Array<{
    key: string;
    header: string;
    type?: "string" | "number" | "boolean" | "date";
    sortable?: boolean;
    filterable?: boolean;
    width?: number;
  }>;
  data: Record<string, unknown>[];
}

// Type for image output
interface ImageOutput {
  src: string;
  alt?: string;
  fileName?: string;
}

interface OutputPanelProps {
  /**
   * Tool execution result
   */
  result: ToolResult<unknown> | null;
  /**
   * Output renderer type
   * @default "code"
   */
  rendererType?: OutputRendererType;
  /**
   * Language for syntax highlighting (when rendererType is "code")
   * @default "plaintext"
   */
  language?: string;
  /**
   * Whether execution is in progress
   * @default false
   */
  isLoading?: boolean;
  /**
   * Default filename for downloads
   */
  downloadFilename?: string;
  /**
   * Callback when copy button is clicked
   */
  onCopy?: () => void;
  /**
   * Callback when download button is clicked
   */
  onDownload?: () => void;
  /**
   * Whether the tool runs in auto mode (client-tier)
   * @default false
   */
  isAutoMode?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function OutputPanel({
  result,
  rendererType = "code",
  language = "plaintext",
  isLoading = false,
  downloadFilename = "output.txt",
  onCopy,
  onDownload,
  isAutoMode = false,
  className,
}: OutputPanelProps): React.ReactElement {
  // Get string representation for copy/download
  const outputValue = useMemo(() => {
    if (!result?.success || !result.data) return "";
    if (typeof result.data === "string") return result.data;
    return JSON.stringify(result.data, null, 2);
  }, [result]);

  // Check if output is copyable/downloadable based on renderer type
  const canCopyDownload = useMemo(() => {
    if (!result?.success || !result.data) return false;
    // Images have their own download mechanism
    if (rendererType === "image") return false;
    return true;
  }, [result, rendererType]);

  // UX-021: Accessible status announcements for screen readers
  const statusAnnouncement = useMemo(() => {
    if (isLoading) {
      return "Processing...";
    } else if (result?.success) {
      const timeStr =
        result.metadata?.executionTime !== undefined
          ? ` Processed in ${formatDuration(result.metadata.executionTime)}.`
          : "";
      return `Execution complete.${timeStr}`;
    } else if (result && !result.success && result.error) {
      return `Execution failed: ${result.error.message}`;
    }
    return "";
  }, [result, isLoading]);

  const renderStatus = (): React.ReactElement | null => {
    if (isLoading) {
      return (
        <span className="output-status output-status-loading">
          <Clock className="h-3 w-3" />
          Processing...
        </span>
      );
    }

    if (!result) return null;

    if (result.success) {
      return (
        <span className="output-status output-status-success">
          <CheckCircle className="h-3 w-3" />
          Success
          {result.metadata?.executionTime !== undefined && (
            <span className="text-muted-foreground">
              ({formatDuration(result.metadata.executionTime)})
            </span>
          )}
        </span>
      );
    }

    return (
      <span className="output-status output-status-error">
        <XCircle className="h-3 w-3" />
        Error
      </span>
    );
  };

  const renderContent = (): React.ReactElement => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner label="Processing..." />
        </div>
      );
    }

    // No result yet
    if (!result) {
      return (
        <EmptyState
          icon={<FileCode className="text-muted-foreground/30 h-12 w-12" />}
          title="No output yet"
          description={
            isAutoMode
              ? "Enter input to see results instantly"
              : "Enter input and click Execute to see the result"
          }
          size="default"
        />
      );
    }

    // Error result
    if (!result.success && result.error) {
      return (
        <div className="p-4">
          <ErrorDisplay
            type="error"
            title={result.error.code}
            message={result.error.message}
            details={result.error.details}
          />
        </div>
      );
    }

    // No data
    if (!result.data) {
      return (
        <EmptyState
          icon={<FileCode className="text-muted-foreground/30 h-12 w-12" />}
          title="Empty result"
          description="The operation completed but produced no output"
          size="default"
        />
      );
    }

    // Render based on type
    switch (rendererType) {
      case "code":
        return <CodeEditor value={outputValue} language={language} readOnly />;

      case "diff": {
        const diffData = result.data as DiffOutput;
        return (
          <DiffViewer
            original={diffData.original || ""}
            modified={diffData.modified || ""}
            mode="split"
            showLineNumbers
            className="h-full"
          />
        );
      }

      case "json-tree":
        return (
          <div className="h-full overflow-auto p-4">
            <JsonTree
              data={result.data}
              defaultExpandDepth={3}
              showCopyButton
            />
          </div>
        );

      case "markdown":
        return (
          <div className="h-full overflow-auto p-6">
            <MarkdownPreview
              content={
                typeof result.data === "string" ? result.data : outputValue
              }
              showCodeCopy
            />
          </div>
        );

      case "table": {
        const tableData = result.data as TableOutput;
        return (
          <div className="h-full overflow-auto p-4">
            <TableViewer
              columns={tableData.columns || []}
              data={tableData.data || []}
              sortable
              filterable
              paginated
              pageSize={10}
              showRowCount
            />
          </div>
        );
      }

      case "html":
        return (
          <HtmlPreview
            content={typeof result.data === "string" ? result.data : ""}
            sandboxed
            showToolbar
            className="h-full"
          />
        );

      case "diagram":
        return (
          <MermaidRenderer
            content={typeof result.data === "string" ? result.data : ""}
            showControls
            className="h-full"
          />
        );

      case "image": {
        const imageData = result.data as ImageOutput | string;
        const src = typeof imageData === "string" ? imageData : imageData.src;
        const alt = typeof imageData === "string" ? "Output" : imageData.alt;
        const fileName =
          typeof imageData === "string" ? "image" : imageData.fileName;
        return (
          <ImagePreview
            src={src}
            alt={alt}
            fileName={fileName}
            showToolbar
            interactive
            className="h-full"
          />
        );
      }

      case "color": {
        const color = typeof result.data === "string" ? result.data : "";
        return (
          <div className="flex h-full items-center justify-center p-8">
            <ColorSwatch color={color} size="lg" showValue showCopy />
          </div>
        );
      }

      case "color-palette": {
        const colors = Array.isArray(result.data)
          ? (result.data as string[])
          : [];
        return (
          <div className="h-full overflow-auto p-6">
            <ColorPalette colors={colors} size="md" showValues />
          </div>
        );
      }

      default:
        // Fallback to code renderer
        return <CodeEditor value={outputValue} language={language} readOnly />;
    }
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
          {canCopyDownload && outputValue && (
            <>
              <CopyButton value={outputValue} size="sm" onCopy={onCopy} />
              <DownloadButton
                content={outputValue}
                filename={downloadFilename}
                size="sm"
                onDownload={onDownload}
              />
            </>
          )}
        </div>
      </div>

      {/* UX-021: Accessible status announcements */}
      <div aria-live="polite" aria-atomic="true" role="status">
        <span className="sr-only">{statusAnnouncement}</span>
      </div>

      {/* Content */}
      <div className="editor-content">{renderContent()}</div>
    </div>
  );
}
