"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes } from "@/lib/utils";

interface FileUploadProps {
  /**
   * Accepted file types (e.g., "image/*", ".json,.xml")
   */
  accept?: string;
  /**
   * Maximum file size in bytes
   * @default 10485760 (10MB)
   */
  maxSize?: number;
  /**
   * Whether to allow multiple files
   * @default false
   */
  multiple?: boolean;
  /**
   * Whether the upload is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Callback when files are selected
   */
  onFilesSelected?: (files: File[]) => void;
  /**
   * Callback when a file is read
   */
  onFileRead?: (file: File, content: string | ArrayBuffer) => void;
  /**
   * Read mode for files
   * @default "text"
   */
  readAs?: "text" | "dataUrl" | "arrayBuffer";
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface FileWithStatus {
  file: File;
  status: "pending" | "reading" | "success" | "error";
  progress: number;
  content?: string | ArrayBuffer;
  error?: string;
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  disabled = false,
  onFilesSelected,
  onFileRead,
  readAs = "text",
  placeholder = "Drop files here or click to upload",
  className,
}: FileUploadProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File exceeds maximum size of ${formatBytes(maxSize)}`;
      }

      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const fileType = file.type;
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExt === type.toLowerCase();
          }
          if (type.endsWith("/*")) {
            return fileType.startsWith(type.replace("/*", "/"));
          }
          return fileType === type;
        });

        if (!isAccepted) {
          return `File type not accepted. Allowed: ${accept}`;
        }
      }

      return null;
    },
    [accept, maxSize]
  );

  const readFile = useCallback(
    (fileWithStatus: FileWithStatus): void => {
      const reader = new FileReader();

      reader.onprogress = (e: ProgressEvent<FileReader>): void => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithStatus.file ? { ...f, progress } : f
            )
          );
        }
      };

      reader.onload = (e: ProgressEvent<FileReader>): void => {
        const content = e.target?.result;
        if (content) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileWithStatus.file
                ? { ...f, status: "success", progress: 100, content }
                : f
            )
          );
          onFileRead?.(fileWithStatus.file, content);
        }
      };

      reader.onerror = (): void => {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === fileWithStatus.file
              ? { ...f, status: "error", error: "Failed to read file" }
              : f
          )
        );
      };

      setFiles((prev) =>
        prev.map((f) =>
          f.file === fileWithStatus.file ? { ...f, status: "reading" } : f
        )
      );

      switch (readAs) {
        case "dataUrl":
          reader.readAsDataURL(fileWithStatus.file);
          break;
        case "arrayBuffer":
          reader.readAsArrayBuffer(fileWithStatus.file);
          break;
        default:
          reader.readAsText(fileWithStatus.file);
      }
    },
    [onFileRead, readAs]
  );

  const processFiles = useCallback(
    (fileList: FileList | File[]): void => {
      const newFiles: FileWithStatus[] = [];
      const validFiles: File[] = [];

      const filesToProcess = Array.from(fileList).slice(
        0,
        multiple ? undefined : 1
      );

      for (const file of filesToProcess) {
        const error = validateFile(file);
        const fileWithStatus: FileWithStatus = {
          file,
          status: error ? "error" : "pending",
          progress: 0,
          error: error || undefined,
        };
        newFiles.push(fileWithStatus);

        if (!error) {
          validFiles.push(file);
        }
      }

      if (multiple) {
        setFiles((prev) => [...prev, ...newFiles]);
      } else {
        setFiles(newFiles);
      }

      onFilesSelected?.(validFiles);

      // Auto-read valid files
      newFiles
        .filter((f) => f.status === "pending")
        .forEach((f) => readFile(f));
    },
    [multiple, onFilesSelected, readFile]
  );

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  };

  const handleClick = (): void => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const removeFile = (file: File): void => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const clearAll = (): void => {
    setFiles([]);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Drop zone */}
      <div
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          !isDragging &&
            !disabled &&
            "hover:border-primary/50 hover:bg-muted/50"
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={placeholder}
        aria-disabled={disabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          className="hidden"
          aria-label={`Upload file${multiple ? "s" : ""}${accept ? `, accepted types: ${accept}` : ""}`}
        />
        <div className="flex flex-col items-center gap-2">
          <Upload
            className={cn(
              "h-10 w-10",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-muted-foreground text-sm">{placeholder}</p>
          {accept && (
            <p className="text-muted-foreground text-xs">Accepted: {accept}</p>
          )}
          {maxSize && (
            <p className="text-muted-foreground text-xs">
              Max size: {formatBytes(maxSize)}
            </p>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {files.length} file{files.length !== 1 ? "s" : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          </div>
          <div className="space-y-2">
            {files.map((fileWithStatus, index) => (
              <div
                key={`${fileWithStatus.file.name}-${index}`}
                className={cn(
                  "flex items-center gap-3 rounded-md border p-3",
                  fileWithStatus.status === "error" &&
                    "border-destructive bg-destructive/5",
                  fileWithStatus.status === "success" &&
                    "border-green-500 bg-green-500/5"
                )}
              >
                {/* Status icon */}
                {fileWithStatus.status === "error" ? (
                  <>
                    <AlertCircle
                      className="text-destructive h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Error</span>
                  </>
                ) : fileWithStatus.status === "success" ? (
                  <>
                    <CheckCircle
                      className="h-5 w-5 flex-shrink-0 text-green-500"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Success</span>
                  </>
                ) : (
                  <File
                    className="text-muted-foreground h-5 w-5 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {fileWithStatus.file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(fileWithStatus.file.size)}
                    {fileWithStatus.error && (
                      <span className="text-destructive ml-2">
                        {fileWithStatus.error}
                      </span>
                    )}
                  </p>

                  {/* Progress bar */}
                  {fileWithStatus.status === "reading" && (
                    <Progress
                      value={fileWithStatus.progress}
                      className="mt-2 h-1"
                    />
                  )}
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label={`Remove ${fileWithStatus.file.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(fileWithStatus.file);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
