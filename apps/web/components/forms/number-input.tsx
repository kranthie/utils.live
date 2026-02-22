"use client";

import { forwardRef, useCallback, useId } from "react";
import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NumberInputProps {
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
   * Current value
   */
  value: number;
  /**
   * Callback when value changes
   */
  onChange: (value: number) => void;
  /**
   * Minimum value
   */
  min?: number;
  /**
   * Maximum value
   */
  max?: number;
  /**
   * Step increment
   * @default 1
   */
  step?: number;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether to show increment/decrement buttons
   * @default true
   */
  showControls?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(
    {
      name,
      label,
      description,
      error,
      required = false,
      disabled = false,
      value,
      onChange,
      min,
      max,
      step = 1,
      placeholder,
      showControls = true,
      className,
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = name ?? generatedId;

    const clampValue = useCallback(
      (val: number): number => {
        let clamped = val;
        if (min !== undefined) clamped = Math.max(min, clamped);
        if (max !== undefined) clamped = Math.min(max, clamped);
        return clamped;
      },
      [min, max]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        if (!isNaN(newValue)) {
          onChange(clampValue(newValue));
        } else if (e.target.value === "") {
          onChange(min ?? 0);
        }
      },
      [onChange, clampValue, min]
    );

    const handleIncrement = useCallback(() => {
      onChange(clampValue(value + step));
    }, [value, step, onChange, clampValue]);

    const handleDecrement = useCallback(() => {
      onChange(clampValue(value - step));
    }, [value, step, onChange, clampValue]);

    const canDecrement = min === undefined || value > min;
    const canIncrement = max === undefined || value < max;

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
        <div className="flex items-center gap-2">
          {showControls && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleDecrement}
              disabled={disabled || !canDecrement}
              aria-label="Decrease value"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={ref}
            id={inputId}
            name={name}
            type="number"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
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
              "text-center tabular-nums",
              error && "border-destructive focus-visible:ring-destructive",
              showControls && "w-24"
            )}
          />
          {showControls && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleIncrement}
              disabled={disabled || !canIncrement}
              aria-label="Increase value"
            >
              <Plus className="h-4 w-4" />
            </Button>
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
