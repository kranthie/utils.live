"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

interface MultiSelectProps<T = string> {
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
   * Available options
   */
  options: SelectOption<T>[];
  /**
   * Currently selected values
   */
  value: T[];
  /**
   * Callback when selection changes
   */
  onChange: (value: T[]) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Maximum number of selections
   */
  maxSelections?: number;
  /**
   * Whether to show selected items as badges
   * @default true
   */
  showBadges?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MultiSelect<T = string>({
  name,
  label,
  description,
  error,
  required = false,
  disabled = false,
  options,
  value,
  onChange,
  placeholder = "Select options...",
  maxSelections,
  showBadges = true,
  className,
}: MultiSelectProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const generatedId = useId();

  const inputId = name ?? generatedId;

  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerQuery) ||
        option.description?.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const canSelectMore = !maxSelections || value.length < maxSelections;

  const handleSelect = useCallback(
    (selectedValue: T) => {
      const isSelected = value.includes(selectedValue);
      if (isSelected) {
        onChange(value.filter((v) => v !== selectedValue));
      } else if (canSelectMore) {
        onChange([...value, selectedValue]);
      }
    },
    [onChange, value, canSelectMore]
  );

  const handleRemove = useCallback(
    (valueToRemove: T, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== valueToRemove));
    },
    [onChange, value]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={disabled}
            className={cn(
              "h-auto min-h-10 w-full justify-between font-normal",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <div className="flex flex-1 flex-wrap gap-1">
              {showBadges && selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={String(option.value)}
                    variant="secondary"
                    className="mr-1"
                  >
                    {option.label}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))
              ) : (
                <span
                  className={cn(
                    !selectedOptions.length && "text-muted-foreground"
                  )}
                >
                  {selectedOptions.length > 0
                    ? `${selectedOptions.length} selected`
                    : placeholder}
                </span>
              )}
            </div>
            <div className="ml-2 flex items-center gap-1">
              {selectedOptions.length > 0 && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClearAll}
                />
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled =
                    option.disabled || (!isSelected && !canSelectMore);

                  return (
                    <CommandItem
                      key={String(option.value)}
                      value={String(option.value)}
                      disabled={isDisabled}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {description && !error && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {maxSelections && (
        <p className="text-muted-foreground text-xs">
          {value.length} / {maxSelections} selected
        </p>
      )}
    </div>
  );
}
