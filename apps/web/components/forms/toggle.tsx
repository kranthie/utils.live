"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  /**
   * Input name for form submission
   */
  name: string;
  /**
   * Whether the toggle is checked
   */
  checked: boolean;
  /**
   * Called when the toggle state changes
   */
  onChange: (checked: boolean) => void;
  /**
   * Label text
   */
  label?: string;
  /**
   * Helper text shown below the toggle
   */
  description?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Whether the toggle is disabled
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function Toggle({
  name,
  checked,
  onChange,
  label,
  description,
  error,
  disabled = false,
  className,
}: ToggleProps): React.ReactElement {
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;
  const describedBy =
    [error ? errorId : undefined, description ? descriptionId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-3",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label ?? name}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary" : "bg-input"
          )}
        >
          <span
            className={cn(
              "bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {label && <span className="text-sm font-medium">{label}</span>}
        <input type="hidden" name={name} value={checked ? "true" : "false"} />
      </label>
      {description && !error && (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
