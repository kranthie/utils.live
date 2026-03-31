"use client";

import { useState, useCallback, useRef, useId } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
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
   * Current tags
   */
  value: string[];
  /**
   * Callback when tags change
   */
  onChange: (value: string[]) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Maximum number of tags
   */
  maxTags?: number;
  /**
   * Maximum length per tag
   */
  maxTagLength?: number;
  /**
   * Keys that trigger tag creation
   * @default ["Enter", ","]
   */
  triggerKeys?: string[];
  /**
   * Predefined suggestions
   */
  suggestions?: string[];
  /**
   * Whether to allow duplicate tags
   * @default false
   */
  allowDuplicates?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function TagInput({
  name,
  label,
  description,
  error,
  required = false,
  disabled = false,
  value,
  onChange,
  placeholder,
  maxTags,
  maxTagLength,
  triggerKeys = ["Enter", ","],
  suggestions,
  allowDuplicates = false,
  className,
}: TagInputProps): React.ReactElement {
  const t = useTranslations("forms.tagInput");
  const displayPlaceholder = placeholder ?? t("defaultPlaceholder");
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();

  const inputId = name ?? generatedId;

  const canAddMore = !maxTags || value.length < maxTags;

  const filteredSuggestions = suggestions?.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      (allowDuplicates || !value.includes(suggestion))
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim();
      if (!trimmedTag) return;
      if (maxTagLength && trimmedTag.length > maxTagLength) return;
      if (!canAddMore) return;
      if (!allowDuplicates && value.includes(trimmedTag)) return;

      onChange([...value, trimmedTag]);
      setInputValue("");
    },
    [value, onChange, maxTagLength, canAddMore, allowDuplicates]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (triggerKeys.includes(e.key)) {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]!);
      }
    },
    [inputValue, value, triggerKeys, addTag, removeTag]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      // Handle comma-separated paste
      if (newValue.includes(",")) {
        const tags = newValue.split(",").filter(Boolean);
        tags.forEach(addTag);
      } else {
        setInputValue(newValue);
      }
    },
    [addTag]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      addTag(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [addTag]
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
      <div
        className={cn(
          "border-input bg-background flex flex-wrap gap-1.5 rounded-md border p-2",
          "focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1">
            {tag}
            {!disabled && (
              <X
                className="hover:text-destructive h-3 w-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
              />
            )}
          </Badge>
        ))}
        {canAddMore && (
          <div className="relative min-w-[120px] flex-1">
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={
                value.length === 0 ? displayPlaceholder : t("addMore")
              }
              disabled={disabled}
              className="h-7 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {showSuggestions &&
              filteredSuggestions &&
              filteredSuggestions.length > 0 && (
                <div className="bg-popover absolute top-full left-0 z-10 mt-1 w-full rounded-md border py-1 shadow-md">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="hover:bg-accent w-full px-3 py-1.5 text-left text-sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
      {description && !error && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {maxTags && (
        <p className="text-muted-foreground text-xs">
          {t("tagsCount", { current: value.length, max: maxTags })}
        </p>
      )}
    </div>
  );
}
