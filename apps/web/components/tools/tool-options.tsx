"use client";

import { useCallback, useMemo } from "react";
import { Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TextInput } from "@/components/forms/text-input";
import { NumberInput } from "@/components/forms/number-input";
import { SearchableSelect } from "@/components/forms/searchable-select";
import { cn } from "@/lib/utils";

interface ToolOptionField {
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
}

interface ToolOptionsSchema {
  type: "object";
  properties: Record<string, ToolOptionField>;
  required?: string[];
}

interface ToolOptionsProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * Tool's options schema (Zod schema converted to JSON Schema)
   */
  schema: ToolOptionsSchema;
  /**
   * Current option values
   */
  values: T;
  /**
   * Callback when options change
   */
  onChange: (values: T) => void;
  /**
   * Whether options are disabled (e.g., during execution)
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to show the options header
   * @default true
   */
  showHeader?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function ToolOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
>({
  schema,
  values,
  onChange,
  disabled = false,
  showHeader = true,
  className,
}: ToolOptionsProps<T>): React.ReactElement {
  const updateValue = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...values, [key]: value } as T);
    },
    [values, onChange]
  );

  const fields = useMemo(() => {
    return Object.entries(schema.properties).map(([key, field]) => ({
      key,
      field,
      isRequired: schema.required?.includes(key) ?? false,
      value: values[key] ?? field.default,
    }));
  }, [schema, values]);

  const renderField = useCallback(
    (
      key: string,
      field: ToolOptionField,
      isRequired: boolean,
      value: unknown
    ) => {
      const label = field.title ?? key;
      const description = field.description;

      // Boolean field - render as switch
      if (field.type === "boolean") {
        return (
          <div key={key} className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <label
                htmlFor={key}
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
              id={key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => updateValue(key, checked)}
              disabled={disabled}
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
            name={key}
            label={label}
            description={description}
            required={isRequired}
            disabled={disabled}
            options={options}
            value={(value as string) ?? null}
            onChange={(newValue) => updateValue(key, newValue)}
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
              <label htmlFor={`slider-${key}`} className="text-sm font-medium">
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
                id={`slider-${key}-desc`}
                className="text-muted-foreground text-xs"
              >
                {description}
              </p>
            )}
            <Slider
              id={`slider-${key}`}
              value={[Number(value) || field.minimum]}
              min={field.minimum}
              max={field.maximum}
              step={1}
              onValueChange={([newValue]) => updateValue(key, newValue)}
              disabled={disabled}
              aria-describedby={description ? `slider-${key}-desc` : undefined}
            />
          </div>
        );
      }

      // Number field - render as number input
      if (field.type === "number" || field.type === "integer") {
        return (
          <NumberInput
            key={key}
            name={key}
            label={label}
            description={description}
            required={isRequired}
            disabled={disabled}
            value={Number(value) || 0}
            onChange={(newValue) => updateValue(key, newValue)}
            min={field.minimum}
            max={field.maximum}
          />
        );
      }

      // String field - render as text input
      return (
        <TextInput
          key={key}
          name={key}
          label={label}
          description={description}
          required={isRequired}
          disabled={disabled}
          value={
            typeof value === "object"
              ? JSON.stringify(value)
              : String((value as string | number) ?? "")
          }
          onChange={(newValue) => updateValue(key, newValue)}
          maxLength={field.maxLength}
        />
      );
    },
    [updateValue, disabled]
  );

  if (fields.length === 0) {
    return <></>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showHeader && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Settings2 className="h-4 w-4" />
          <span>Options</span>
        </div>
      )}
      <div className="space-y-4">
        {fields.map(({ key, field, isRequired, value }) =>
          renderField(key, field, isRequired, value)
        )}
      </div>
    </div>
  );
}
