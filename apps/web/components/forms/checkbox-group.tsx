"use client";

import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface CheckboxOption {
  /**
   * Unique value for the checkbox
   */
  value: string;
  /**
   * Display label for the checkbox
   */
  label: string;
  /**
   * Optional description shown below label
   */
  description?: string;
  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  /**
   * Group label displayed above checkboxes
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text / description for the group
   */
  description?: string;
  /**
   * Whether the group is required
   */
  required?: boolean;
  /**
   * Available checkbox options
   */
  options: CheckboxOption[];
  /**
   * Currently selected values
   */
  value?: string[];
  /**
   * Callback when selection changes
   */
  onChange?: (value: string[]) => void;
  /**
   * Layout orientation
   * @default 'vertical'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether the entire group is disabled
   */
  disabled?: boolean;
  /**
   * Additional class names
   */
  className?: string;
  /**
   * ID for the checkbox group
   */
  id?: string;
  /**
   * Name attribute for form submission
   */
  name?: string;
}

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      label,
      error,
      description,
      required,
      options,
      value = [],
      onChange,
      orientation = "vertical",
      disabled = false,
      className,
      id,
      name,
    },
    ref
  ) => {
    const generatedId = useId();
    const groupId = id ?? name ?? generatedId;
    const errorId = `${groupId}-error`;
    const descriptionId = `${groupId}-description`;

    const handleCheckboxChange = (
      optionValue: string,
      checked: boolean
    ): void => {
      if (disabled) return;

      const newValue = checked
        ? [...value, optionValue]
        : value.filter((v) => v !== optionValue);

      onChange?.(newValue);
    };

    return (
      // eslint-disable-next-line jsx-a11y/role-supports-aria-props
      <div
        ref={ref}
        className={cn("w-full space-y-3", className)}
        role="group"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-describedby={
          error ? errorId : description ? descriptionId : undefined
        }
        aria-invalid={!!error}
      >
        {label && (
          <Label
            id={`${groupId}-label`}
            className={cn(
              "text-sm leading-none font-medium",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}

        <div
          className={cn(
            "flex gap-3",
            orientation === "vertical" ? "flex-col" : "flex-row flex-wrap"
          )}
        >
          {options.map((option) => {
            const optionId = `${groupId}-${option.value}`;
            const isChecked = value.includes(option.value);
            const isDisabled = disabled || option.disabled;

            return (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={optionId}
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.value, checked === true)
                  }
                  aria-describedby={
                    option.description ? `${optionId}-desc` : undefined
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={optionId}
                    className={cn(
                      "cursor-pointer text-sm font-normal",
                      isDisabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {option.label}
                  </Label>
                  {option.description && (
                    <p
                      id={`${optionId}-desc`}
                      className="text-muted-foreground text-xs"
                    >
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";
