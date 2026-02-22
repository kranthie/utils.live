"use client";

import { forwardRef, useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TextInputProps {
  /**
   * Field name for form integration
   */
  name?: string;
  /**
   * Field label
   */
  label?: string;
  /**
   * Helper text shown below the field
   */
  description?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Input type
   * @default "text"
   */
  type?: "text" | "email" | "password" | "url" | "search";
  /**
   * Current value
   */
  value: string;
  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Maximum length
   */
  maxLength?: number;
  /**
   * Left addon (icon or text)
   */
  startAddon?: ReactNode;
  /**
   * Right addon (icon or text)
   */
  endAddon?: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      name,
      label,
      description,
      error,
      required = false,
      disabled = false,
      type = "text",
      value,
      onChange,
      placeholder,
      maxLength,
      startAddon,
      endAddon,
      className,
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = name ?? generatedId;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {startAddon && (
            <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
              {startAddon}
            </div>
          )}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : description
                  ? `${inputId}-description`
                  : undefined
            }
            className={cn(
              startAddon && "pl-10",
              endAddon && "pr-10",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {endAddon && (
            <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
              {endAddon}
            </div>
          )}
        </div>
        {description && !error && (
          <p
            id={`${inputId}-description`}
            className="text-muted-foreground text-sm"
          >
            {description}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
    );
  }
);
