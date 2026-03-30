"use client";

import { useCallback, useMemo } from "react";
import { Play, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SchemaField } from "./schema-field-renderer";
import { SchemaFieldRenderer } from "./schema-field-renderer";
import { cn } from "@/lib/utils";

/**
 * JSON Schema object definition with properties.
 */
interface SchemaObject {
  type: "object";
  properties?: Record<string, SchemaField>;
  required?: string[];
}

interface GeneratorOptionsPanelProps {
  /**
   * Tool input schema (JSON Schema format).
   * For generator tools, this defines the structured inputs (e.g., count, type).
   */
  inputSchema: SchemaObject;
  /**
   * Tool options schema (JSON Schema format).
   * Additional configuration options for the tool.
   */
  optionsSchema: SchemaObject;
  /**
   * Current input values
   */
  inputValues: Record<string, unknown>;
  /**
   * Current option values
   */
  optionValues: Record<string, unknown>;
  /**
   * Callback when input values change
   */
  onInputChange: (values: Record<string, unknown>) => void;
  /**
   * Callback when option values change
   */
  onOptionChange: (values: Record<string, unknown>) => void;
  /**
   * Callback to trigger execution
   */
  onExecute: () => void;
  /**
   * Whether the tool is currently executing
   * @default false
   */
  isExecuting?: boolean;
  /**
   * Whether the tool is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Tool name for display purposes
   */
  toolName: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * GeneratorOptionsPanel renders tool inputs and options as form controls
 * instead of a Monaco code editor. This is used for generator and
 * calculator tools that have structured inputs with defaults rather
 * than freeform text input.
 */
export function GeneratorOptionsPanel({
  inputSchema,
  optionsSchema,
  inputValues,
  optionValues,
  onInputChange,
  onOptionChange,
  onExecute,
  isExecuting = false,
  disabled = false,
  toolName: _toolName,
  className,
}: GeneratorOptionsPanelProps): React.ReactElement {
  const updateInputValue = useCallback(
    (key: string, value: unknown) => {
      onInputChange({ ...inputValues, [key]: value });
    },
    [inputValues, onInputChange]
  );

  const updateOptionValue = useCallback(
    (key: string, value: unknown) => {
      onOptionChange({ ...optionValues, [key]: value });
    },
    [optionValues, onOptionChange]
  );

  const inputFields = useMemo(() => {
    if (!inputSchema.properties) return [];
    return Object.entries(inputSchema.properties).map(([key, field]) => ({
      key,
      field,
      isRequired: inputSchema.required?.includes(key) ?? false,
      value: inputValues[key] ?? field.default,
    }));
  }, [inputSchema, inputValues]);

  const optionFields = useMemo(() => {
    if (!optionsSchema.properties) return [];
    return Object.entries(optionsSchema.properties).map(([key, field]) => ({
      key,
      field,
      isRequired: optionsSchema.required?.includes(key) ?? false,
      value: optionValues[key] ?? field.default,
    }));
  }, [optionsSchema, optionValues]);

  const hasInputFields = inputFields.length > 0;
  const hasOptionFields = optionFields.length > 0;
  const isDisabled = disabled || isExecuting;

  return (
    <div className={cn("editor-wrapper flex flex-col", className)}>
      {/* Header */}
      <div className="editor-header">
        <div className="flex items-center gap-2">
          <span className="editor-header-title">Configure</span>
        </div>
        <div className="editor-header-actions">
          <Button
            onClick={onExecute}
            disabled={isDisabled}
            size="sm"
            className="h-7"
          >
            <Play className="mr-1 h-3.5 w-3.5" />
            {isExecuting ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Input fields */}
          {hasInputFields && (
            <div className="space-y-4">
              {hasOptionFields && (
                <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Parameters
                </p>
              )}
              <div className="space-y-4">
                {inputFields.map(({ key, field, isRequired, value }) => (
                  <SchemaFieldRenderer
                    key={key}
                    fieldKey={key}
                    field={field}
                    isRequired={isRequired}
                    value={value}
                    disabled={isDisabled}
                    idPrefix="gen-"
                    onChange={updateInputValue}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Options fields */}
          {hasOptionFields && (
            <div className="space-y-4">
              {hasInputFields && (
                <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Options
                </p>
              )}
              <div className="space-y-4">
                {optionFields.map(({ key, field, isRequired, value }) => (
                  <SchemaFieldRenderer
                    key={key}
                    fieldKey={key}
                    field={field}
                    isRequired={isRequired}
                    value={value}
                    disabled={isDisabled}
                    idPrefix="gen-"
                    onChange={updateOptionValue}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
