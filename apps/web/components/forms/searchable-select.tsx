"use client";

import { useState, useMemo, useCallback, useId } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface SearchableSelectProps<T = string> {
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
   * Currently selected value
   */
  value: T | null;
  /**
   * Callback when selection changes
   */
  onChange: (value: T | null) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the select is searchable
   * @default true
   */
  searchable?: boolean;
  /**
   * Whether the select is clearable
   * @default false
   */
  clearable?: boolean;
  /**
   * Custom filter function
   */
  filterFn?: (option: SelectOption<T>, query: string) => boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function SearchableSelect<T = string>({
  name,
  label,
  description,
  error,
  required = false,
  disabled = false,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchable = true,
  clearable = false,
  filterFn,
  className,
}: SearchableSelectProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const generatedId = useId();

  const inputId = name ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [
      error ? errorId : undefined,
      description && !error ? descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!query) return options;
    const lowerQuery = query.toLowerCase();
    return options.filter((option) => {
      if (filterFn) return filterFn(option, query);
      return (
        option.label.toLowerCase().includes(lowerQuery) ||
        option.description?.toLowerCase().includes(lowerQuery)
      );
    });
  }, [options, query, filterFn]);

  const handleSelect = useCallback(
    (selectedValue: T) => {
      onChange(selectedValue === value ? null : selectedValue);
      setOpen(false);
      setQuery("");
    },
    [onChange, value]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
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
            aria-describedby={describedBy}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !selectedOption && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive"
            )}
          >
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <div className="flex items-center gap-1">
              {clearable && selectedOption && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClear}
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
            {searchable && (
              <CommandInput
                placeholder="Search..."
                value={query}
                onValueChange={setQuery}
              />
            )}
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={String(option.value)}
                    value={String(option.value)}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
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
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
