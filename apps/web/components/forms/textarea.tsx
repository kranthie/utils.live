"use client";

import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label for the textarea
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text / description
   */
  description?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Whether to auto-resize based on content
   * @default false
   */
  autoResize?: boolean;
  /**
   * Minimum number of rows
   * @default 3
   */
  minRows?: number;
  /**
   * Maximum number of rows (for auto-resize)
   * @default 10
   */
  maxRows?: number;
  /**
   * Show character count
   * @default false
   */
  showCount?: boolean;
  /**
   * Maximum character length
   */
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      description,
      required,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      showCount = false,
      maxLength,
      id,
      name,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id ?? name ?? generatedId;
    const errorId = `${textareaId}-error`;
    const descriptionId = `${textareaId}-description`;

    const charCount = typeof value === "string" ? value.length : 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      if (autoResize) {
        const textarea = e.target;
        textarea.style.height = "auto";
        const lineHeight =
          parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        const newHeight = Math.min(
          Math.max(textarea.scrollHeight, minHeight),
          maxHeight
        );
        textarea.style.height = `${newHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-2">
        {label && (
          <Label
            htmlFor={textareaId}
            className={cn(error && "text-destructive")}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            name={name}
            value={value}
            onChange={handleChange}
            rows={minRows}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : description ? descriptionId : undefined
            }
            className={cn(
              "border-input bg-background ring-offset-background flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
              "disabled:cursor-not-allowed disabled:opacity-50",
              autoResize && "resize-none overflow-hidden",
              !autoResize && "resize-y",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {error && (
              <p
                id={errorId}
                className="text-destructive flex items-center gap-1.5 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            {!error && description && (
              <p id={descriptionId} className="text-muted-foreground text-sm">
                {description}
              </p>
            )}
          </div>

          {showCount && (
            <p
              className={cn(
                "text-muted-foreground text-xs",
                maxLength && charCount >= maxLength && "text-destructive"
              )}
            >
              {charCount}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
