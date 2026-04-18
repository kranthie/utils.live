"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Upload, FileText, Trash2, AlertCircle, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EditorFallback } from "./editor-fallback";
import { CopyButton } from "@/components/shared/copy-button";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

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

interface InputPanelProps {
  /**
   * Current input value
   */
  value: string;
  /**
   * Callback when input changes
   */
  onChange: (value: string) => void;
  /**
   * Language for syntax highlighting
   * @default "plaintext"
   */
  language?: string;
  /**
   * Placeholder text
   */
  placeholder?: string;
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
   * Callback when a file is uploaded
   */
  onFileUpload?: (content: string, filename: string) => void;
  /**
   * Whether the panel is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Sample data to load into the editor when the "Sample" button is clicked.
   * When provided, shows a "Sample" button in the toolbar.
   */
  sampleData?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function InputPanel({
  value,
  onChange,
  language = "plaintext",
  placeholder = "Enter your input here...",
  allowFileUpload = false,
  acceptedFileTypes,
  maxFileSize = 10485760,
  onFileUpload,
  disabled = false,
  sampleData,
  className,
}: InputPanelProps): React.ReactElement {
  const t = useTranslations("editor.input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClear = useCallback(() => {
    onChange("");
    setUploadedFile(null);
    setUploadError(null);
  }, [onChange]);

  const handleLoadSample = useCallback(() => {
    if (sampleData) {
      onChange(sampleData);
      setUploadedFile(null);
      setUploadError(null);
    }
  }, [sampleData, onChange]);

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
        onFileUpload?.(content, file.name);
      } catch (err) {
        setUploadError(t("failedToRead"));
        console.error("Failed to read file:", err);
      }
    },
    [validateFile, onChange, onFileUpload, t]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleFileInput(file);
      }
      // Reset input so the same file can be selected again
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
            <span className="font-medium">{t("dropFileHere")}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="editor-header">
        <div className="flex flex-wrap items-center gap-2">
          <span className="editor-header-title">{t("title")}</span>
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
          {sampleData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadSample}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground h-7 px-2"
              aria-label={t("loadSampleAriaLabel")}
            >
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              {t("sampleButton")}
            </Button>
          )}
          {allowFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept={acceptedFileTypes?.join(",")}
                onChange={handleFileChange}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                aria-label={t("uploadButton")}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                {t("uploadButton")}
              </Button>
            </>
          )}
          <CopyButton value={value} size="sm" />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="text-muted-foreground hover:text-destructive h-7 px-2"
              aria-label={t("clearAriaLabel")}
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
              ? `${placeholder}\n\n${t("dragAndDrop")}`
              : placeholder
          }
          readOnly={disabled}
        />
      </div>
    </div>
  );
}
