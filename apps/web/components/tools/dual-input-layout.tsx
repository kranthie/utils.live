"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorFallback } from "@/components/editor/editor-fallback";
import { CopyButton } from "@/components/shared/copy-button";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import "@/styles/editor.css";

// Lazy load Monaco Editor
const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((mod) => mod.CodeEditor),
  {
    loading: () => (
      <EditorFallback value="" placeholder="Loading editor..." readOnly />
    ),
    ssr: false,
  }
);

interface UploadedFile {
  name: string;
  size: number;
}

interface DualInputLayoutProps {
  /**
   * Current value of the original (left) input
   */
  originalValue: string;
  /**
   * Current value of the modified (right) input
   */
  modifiedValue: string;
  /**
   * Callback when the original input changes
   */
  onOriginalChange: (value: string) => void;
  /**
   * Callback when the modified input changes
   */
  onModifiedChange: (value: string) => void;
  /**
   * Language for syntax highlighting
   * @default "plaintext"
   */
  language?: string;
  /**
   * Whether file upload is enabled
   * @default false
   */
  allowFileUpload?: boolean;
  /**
   * Accepted file types (when file upload is enabled)
   */
  acceptedFileTypes?: string[];
  /**
   * Maximum file size in bytes
   * @default 10485760 (10MB)
   */
  maxFileSize?: number;
  /**
   * Whether the panel is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Input panel for a single side of the dual input layout.
 * Contains its own file upload state, clear, and copy buttons.
 */
function DualInputPanel({
  label,
  value,
  onChange,
  language = "plaintext",
  placeholder,
  allowFileUpload = false,
  acceptedFileTypes,
  maxFileSize = 10485760,
  disabled = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  allowFileUpload?: boolean;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClear = useCallback(() => {
    onChange("");
    setUploadedFile(null);
    setUploadError(null);
  }, [onChange]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File exceeds maximum size of ${formatBytes(maxFileSize)}`;
      }

      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isAccepted = acceptedFileTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExt === type.toLowerCase();
          }
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.replace("/*", "/"));
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `File type not accepted. Allowed: ${acceptedFileTypes.join(", ")}`;
        }
      }

      return null;
    },
    [maxFileSize, acceptedFileTypes]
  );

  const handleFileInput = useCallback(
    async (file: File) => {
      setUploadError(null);

      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }

      try {
        const content = await file.text();
        onChange(content);
        setUploadedFile({ name: file.name, size: file.size });
      } catch {
        setUploadError("Failed to read file");
      }
    },
    [validateFile, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleFileInput(file);
      }
      e.target.value = "";
    },
    [handleFileInput]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!allowFileUpload || disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        void handleFileInput(file);
      }
    },
    [allowFileUpload, disabled, handleFileInput]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (allowFileUpload && !disabled) {
        setIsDragging(true);
      }
    },
    [allowFileUpload, disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn("editor-wrapper relative", className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {isDragging && allowFileUpload && (
        <div className="bg-primary/10 border-primary absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-primary flex flex-col items-center gap-2">
            <Upload className="h-10 w-10" />
            <span className="font-medium">Drop file here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="editor-header">
        <div className="flex flex-wrap items-center gap-2">
          <span className="editor-header-title">{label}</span>
          {uploadedFile && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3" />
              {uploadedFile.name} ({formatBytes(uploadedFile.size)})
            </span>
          )}
          {uploadError && (
            <span className="text-destructive flex items-center gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {uploadError}
            </span>
          )}
        </div>
        <div className="editor-header-actions">
          {allowFileUpload && (
            <label>
              <input
                type="file"
                className="sr-only"
                accept={acceptedFileTypes?.join(",")}
                onChange={handleFileChange}
                disabled={disabled}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={disabled}
                asChild
              >
                <span>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload
                </span>
              </Button>
            </label>
          )}
          <CopyButton value={value} size="sm" />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive h-7 px-2"
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-content">
        <CodeEditor
          value={value}
          onChange={onChange}
          language={language}
          placeholder={
            allowFileUpload
              ? `${placeholder ?? `Enter ${label.toLowerCase()} text...`}\n\nOr drag and drop a file here`
              : (placeholder ?? `Enter ${label.toLowerCase()} text...`)
          }
          readOnly={disabled}
        />
      </div>
    </div>
  );
}

/**
 * DualInputLayout provides two side-by-side Monaco editors for diff/comparison tools.
 * On desktop, they appear side-by-side with a swap button between them.
 * On mobile, tabs switch between "Original" and "Modified" inputs.
 */
export function DualInputLayout({
  originalValue,
  modifiedValue,
  onOriginalChange,
  onModifiedChange,
  language = "plaintext",
  allowFileUpload = false,
  acceptedFileTypes,
  maxFileSize = 10485760,
  disabled = false,
  className,
}: DualInputLayoutProps): React.ReactElement {
  const isMobile = useIsMobile();
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "original" | "modified"
  >("original");

  const handleSwap = useCallback(() => {
    const tempOriginal = originalValue;
    onOriginalChange(modifiedValue);
    onModifiedChange(tempOriginal);
  }, [originalValue, modifiedValue, onOriginalChange, onModifiedChange]);

  // Mobile tabbed view
  if (isMobile) {
    return (
      <div className={cn("flex h-full min-h-0 flex-col", className)}>
        {/* Mobile tab toggle */}
        <div
          className="bg-muted/30 flex flex-shrink-0 items-center border-b"
          role="tablist"
          aria-label="Input panels"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileActiveTab === "original"}
            aria-controls="dual-panel-original"
            className={cn(
              "flex-1 touch-manipulation px-4 py-3 text-sm font-medium transition-colors",
              mobileActiveTab === "original"
                ? "bg-background border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileActiveTab("original")}
          >
            Original
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwap}
            className="mx-1 h-8 w-8 flex-shrink-0"
            aria-label="Swap original and modified"
            disabled={disabled}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileActiveTab === "modified"}
            aria-controls="dual-panel-modified"
            className={cn(
              "flex-1 touch-manipulation px-4 py-3 text-sm font-medium transition-colors",
              mobileActiveTab === "modified"
                ? "bg-background border-primary text-primary border-b-2"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setMobileActiveTab("modified")}
          >
            Modified
          </button>
        </div>

        {/* Panel content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            id="dual-panel-original"
            role="tabpanel"
            aria-hidden={mobileActiveTab !== "original"}
            className={cn(mobileActiveTab !== "original" && "hidden", "h-full")}
          >
            <DualInputPanel
              label="Original"
              value={originalValue}
              onChange={onOriginalChange}
              language={language}
              placeholder="Enter original text..."
              allowFileUpload={allowFileUpload}
              acceptedFileTypes={acceptedFileTypes}
              maxFileSize={maxFileSize}
              disabled={disabled}
            />
          </div>
          <div
            id="dual-panel-modified"
            role="tabpanel"
            aria-hidden={mobileActiveTab !== "modified"}
            className={cn(mobileActiveTab !== "modified" && "hidden", "h-full")}
          >
            <DualInputPanel
              label="Modified"
              value={modifiedValue}
              onChange={onModifiedChange}
              language={language}
              placeholder="Enter modified text..."
              allowFileUpload={allowFileUpload}
              acceptedFileTypes={acceptedFileTypes}
              maxFileSize={maxFileSize}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop side-by-side view
  return (
    <div className={cn("flex h-full min-h-0 flex-row gap-0", className)}>
      {/* Original (left) panel */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <DualInputPanel
          label="Original"
          value={originalValue}
          onChange={onOriginalChange}
          language={language}
          placeholder="Enter original text..."
          allowFileUpload={allowFileUpload}
          acceptedFileTypes={acceptedFileTypes}
          maxFileSize={maxFileSize}
          disabled={disabled}
        />
      </div>

      {/* Swap button divider */}
      <div className="flex flex-shrink-0 flex-col items-center justify-center px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleSwap}
          className="h-8 w-8"
          aria-label="Swap original and modified"
          disabled={disabled}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Modified (right) panel */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <DualInputPanel
          label="Modified"
          value={modifiedValue}
          onChange={onModifiedChange}
          language={language}
          placeholder="Enter modified text..."
          allowFileUpload={allowFileUpload}
          acceptedFileTypes={acceptedFileTypes}
          maxFileSize={maxFileSize}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
