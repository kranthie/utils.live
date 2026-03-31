"use client";

import { useCallback } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, uniqueId } from "@/lib/utils";

interface KeyValuePair {
  key: string;
  value: string;
  id?: string;
}

interface KeyValueEditorProps {
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
   * Current key-value pairs
   */
  value: KeyValuePair[];
  /**
   * Callback when pairs change
   */
  onChange: (value: KeyValuePair[]) => void;
  /**
   * Key field label
   * @default "Key"
   */
  keyLabel?: string;
  /**
   * Value field label
   * @default "Value"
   */
  valueLabel?: string;
  /**
   * Key placeholder
   */
  keyPlaceholder?: string;
  /**
   * Value placeholder
   */
  valuePlaceholder?: string;
  /**
   * Maximum number of pairs
   */
  maxPairs?: number;
  /**
   * Whether keys must be unique
   * @default true
   */
  uniqueKeys?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function KeyValueEditor({
  name: _name,
  label,
  description,
  error,
  required = false,
  disabled = false,
  value,
  onChange,
  keyLabel,
  valueLabel,
  keyPlaceholder,
  valuePlaceholder,
  maxPairs,
  uniqueKeys = true,
  className,
}: KeyValueEditorProps): React.ReactElement {
  const t = useTranslations("forms.keyValueEditor");
  const displayKeyLabel = keyLabel ?? t("defaultKeyLabel");
  const displayValueLabel = valueLabel ?? t("defaultValueLabel");
  const displayKeyPlaceholder = keyPlaceholder ?? t("defaultKeyPlaceholder");
  const displayValuePlaceholder =
    valuePlaceholder ?? t("defaultValuePlaceholder");
  const canAddMore = !maxPairs || value.length < maxPairs;

  const handleAddPair = useCallback(() => {
    if (!canAddMore) return;
    onChange([...value, { key: "", value: "", id: uniqueId("kv-") }]);
  }, [value, onChange, canAddMore]);

  const handleRemovePair = useCallback(
    (index: number) => {
      const newPairs = [...value];
      newPairs.splice(index, 1);
      onChange(newPairs);
    },
    [value, onChange]
  );

  const handleKeyChange = useCallback(
    (index: number, newKey: string) => {
      const newPairs = [...value];
      const existing = newPairs[index];
      if (existing) newPairs[index] = { ...existing, key: newKey };
      onChange(newPairs);
    },
    [value, onChange]
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string) => {
      const newPairs = [...value];
      const existing = newPairs[index];
      if (existing) newPairs[index] = { ...existing, value: newValue };
      onChange(newPairs);
    },
    [value, onChange]
  );

  const getDuplicateKeyError = useCallback(
    (key: string, currentIndex: number): string | undefined => {
      if (!uniqueKeys || !key) return undefined;
      const isDuplicate = value.some(
        (pair, index) => index !== currentIndex && pair.key === key
      );
      return isDuplicate ? t("duplicateKey") : undefined;
    },
    [value, uniqueKeys, t]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* Header Row */}
      {value.length > 0 && (
        <div className="text-muted-foreground grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-medium">
          <div className="w-6" /> {/* Grip placeholder */}
          <div>{displayKeyLabel}</div>
          <div>{displayValueLabel}</div>
          <div className="w-9" /> {/* Delete placeholder */}
        </div>
      )}

      {/* Pairs */}
      <div className="space-y-2">
        {value.map((pair, index) => {
          const keyError = getDuplicateKeyError(pair.key, index);
          return (
            <div
              key={pair.id ?? index}
              className="grid grid-cols-[auto_1fr_1fr_auto] items-start gap-2"
            >
              <div className="flex h-10 items-center">
                <GripVertical className="text-muted-foreground/50 h-4 w-4 cursor-grab" />
              </div>
              <div className="space-y-1">
                <Input
                  value={pair.key}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  placeholder={displayKeyPlaceholder}
                  disabled={disabled}
                  aria-label={t("keyAriaLabel", {
                    label: displayKeyLabel,
                    index: index + 1,
                  })}
                  className={cn(keyError && "border-destructive")}
                />
                {keyError && (
                  <p className="text-destructive text-xs">{keyError}</p>
                )}
              </div>
              <Input
                value={pair.value}
                onChange={(e) => handleValueChange(index, e.target.value)}
                placeholder={displayValuePlaceholder}
                disabled={disabled}
                aria-label={t("valueAriaLabel", {
                  label: displayValueLabel,
                  index: index + 1,
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemovePair(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-destructive h-10 w-9"
                aria-label={t("removeAriaLabel", { index: index + 1 })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPair}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addPair", {
            keyLabel: displayKeyLabel,
            valueLabel: displayValueLabel,
          })}
        </Button>
      )}

      {description && !error && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
      {maxPairs && (
        <p className="text-muted-foreground text-xs">
          {t("pairsCount", { current: value.length, max: maxPairs })}
        </p>
      )}
    </div>
  );
}
