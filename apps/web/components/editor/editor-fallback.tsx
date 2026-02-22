"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import "@/styles/editor.css";

interface EditorFallbackProps {
  /**
   * The current value
   */
  value: string;
  /**
   * Callback when the value changes
   */
  onChange?: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the textarea is read-only
   * @default false
   */
  readOnly?: boolean;
  /**
   * Minimum height
   * @default "200px"
   */
  minHeight?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * A simple textarea fallback for when Monaco Editor isn't available or loading.
 * Used for graceful degradation and as a loading placeholder.
 */
export function EditorFallback({
  value,
  onChange,
  placeholder,
  readOnly = false,
  minHeight = "200px",
  className,
  ariaLabel,
}: EditorFallbackProps): React.ReactElement {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle Tab key for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue =
          value.substring(0, start) + "  " + value.substring(end);

        onChange?.(newValue);

        // Restore cursor position
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div
      className={cn(
        "border-input bg-background relative overflow-hidden rounded-md border",
        className
      )}
      style={{ minHeight }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        className="editor-textarea"
        style={{ minHeight }}
        aria-label={ariaLabel}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
