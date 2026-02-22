"use client";

import { useCallback, useMemo } from "react";
import { Play, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TextInput } from "@/components/forms/text-input";
import { NumberInput } from "@/components/forms/number-input";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { cn } from "@/lib/utils";

/**
 * JSON Schema field definition extracted from Zod schemas.
 */
interface SchemaField {
  type: "string" | "number" | "integer" | "boolean" | "array";
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  enumNames?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: SchemaField;
}

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
  toolName,
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

  const renderField = useCallback(
    (
      key: string,
      field: SchemaField,
      isRequired: boolean,
      value: unknown,
      updateFn: (key: string, value: unknown) => void
    ) => {
      const label = field.title ?? key;
      const description = field.description;

      // Boolean field - render as switch
      if (field.type === "boolean") {
        return (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <label
                htmlFor={`gen-${key}`}
                className="cursor-pointer text-sm font-medium"
              >
                {label}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </label>
              {description && (
                <p className="text-muted-foreground text-xs">{description}</p>
              )}
            </div>
            <Switch
              id={`gen-${key}`}
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateFn(key, checked)}
              disabled={disabled || isExecuting}
            />
          </div>
        );
      }

      // Enum field - render as select
      if (field.enum && field.enum.length > 0) {
        const options = field.enum.map((enumValue, index) => ({
          value: enumValue as string,
          label: field.enumNames?.[index] ?? String(enumValue),
        }));

        return (
          <SearchableSelect
            key={key}
            name={`gen-${key}`}
            label={label}
            description={description}
            required={isRequired}
            disabled={disabled || isExecuting}
            options={options}
            value={(value as string) ?? null}
            onChange={(newValue) => updateFn(key, newValue)}
            searchable={options.length > 5}
          />
        );
      }

      // Number field with range - render as slider
      if (
        (field.type === "number" || field.type === "integer") &&
        field.minimum !== undefined &&
        field.maximum !== undefined
      ) {
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor={`gen-slider-${key}`}
                className="text-sm font-medium"
              >
                {label}
                {isRequired && <span className="text-destructive ml-1">*</span>}
              </label>
              <span
                className="text-muted-foreground text-sm tabular-nums"
                aria-live="polite"
              >
                {value as number}
              </span>
            </div>
            {description && (
              <p
                id={`gen-slider-${key}-desc`}
                className="text-muted-foreground text-xs"
              >
                {description}
              </p>
            )}
            <Slider
              id={`gen-slider-${key}`}
              value={[Number(value) || field.minimum]}
              min={field.minimum}
              max={field.maximum}
              step={1}
              onValueChange={([newValue]) => updateFn(key, newValue)}
              disabled={disabled || isExecuting}
              aria-describedby={
                description ? `gen-slider-${key}-desc` : undefined
              }
            />
          </div>
        );
      }

      // Number field - render as number input
      if (field.type === "number" || field.type === "integer") {
        return (
          <NumberInput
            key={key}
            name={`gen-${key}`}
            label={label}
            description={description}
            required={isRequired}
            disabled={disabled || isExecuting}
            value={Number(value) || 0}
            onChange={(newValue) => updateFn(key, newValue)}
            min={field.minimum}
            max={field.maximum}
          />
        );
      }

      // String field - render as text input
      return (
        <TextInput
          key={key}
          name={`gen-${key}`}
          label={label}
          description={description}
          required={isRequired}
          disabled={disabled || isExecuting}
          value={
            typeof value === "object"
              ? JSON.stringify(value)
              : String((value as string | number) ?? "")
          }
          onChange={(newValue) => updateFn(key, newValue)}
          maxLength={field.maxLength}
        />
      );
    },
    [disabled, isExecuting]
  );

  const hasInputFields = inputFields.length > 0;
  const hasOptionFields = optionFields.length > 0;

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
            disabled={disabled || isExecuting}
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
              <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Settings2 className="h-4 w-4" />
                <span>{toolName} Settings</span>
              </div>
              <div className="space-y-4">
                {inputFields.map(({ key, field, isRequired, value }) =>
                  renderField(key, field, isRequired, value, updateInputValue)
                )}
              </div>
            </div>
          )}

          {/* Options fields */}
          {hasOptionFields && (
            <div className="space-y-4">
              {hasInputFields && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  <span>Options</span>
                </div>
              )}
              {!hasInputFields && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  <span>{toolName} Settings</span>
                </div>
              )}
              <div className="space-y-4">
                {optionFields.map(({ key, field, isRequired, value }) =>
                  renderField(key, field, isRequired, value, updateOptionValue)
                )}
              </div>
            </div>
          )}

          {/* Generate button (prominent, centered) */}
          <div className="pt-2">
            <Button
              onClick={onExecute}
              disabled={disabled || isExecuting}
              size="lg"
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {isExecuting ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
