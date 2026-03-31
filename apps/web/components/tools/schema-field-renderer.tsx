"use client";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TextInput } from "@/components/forms/text-input";
import { NumberInput } from "@/components/forms/number-input";
import { SearchableSelect } from "@/components/forms/searchable-select";

/**
 * JSON Schema field definition extracted from Zod schemas.
 */
export interface SchemaField {
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

export interface SchemaFieldRendererProps {
  /**
   * The schema key for this field (used to derive IDs and names)
   */
  fieldKey: string;
  /**
   * The field schema definition
   */
  field: SchemaField;
  /**
   * Whether this field is required
   */
  isRequired: boolean;
  /**
   * Current value of the field
   */
  value: unknown;
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Prefix prepended to all element IDs and names.
   * Use "gen-" for generator fields to avoid ID collisions with options fields.
   * @default ""
   */
  idPrefix?: string;
  /**
   * Callback when the field value changes
   */
  onChange: (key: string, value: unknown) => void;
}

/**
 * Renders a single schema field as the appropriate UI control based on
 * the field type and constraints. Supports boolean (Switch), enum
 * (SearchableSelect), number with range (Slider), number (NumberInput),
 * and string (TextInput).
 */
export function SchemaFieldRenderer({
  fieldKey,
  field,
  isRequired,
  value,
  disabled = false,
  idPrefix = "",
  onChange,
}: SchemaFieldRendererProps): React.ReactElement {
  const label =
    field.title ??
    fieldKey
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (c) => c.toUpperCase());
  const description = field.description;
  const id = `${idPrefix}${fieldKey}`;

  // Boolean field - render as switch
  if (field.type === "boolean") {
    return (
      <div key={fieldKey} className="flex items-center justify-between py-2">
        <div className="space-y-0.5">
          <label htmlFor={id} className="cursor-pointer text-sm font-medium">
            {label}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
        <Switch
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(fieldKey, checked)}
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
        key={fieldKey}
        name={id}
        label={label}
        description={description}
        required={isRequired}
        disabled={disabled}
        options={options}
        value={(value as string) ?? null}
        onChange={(newValue) => onChange(fieldKey, newValue)}
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
    const sliderId = `${idPrefix}slider-${fieldKey}`;
    return (
      <div key={fieldKey} className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor={sliderId} className="text-sm font-medium">
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
          <p id={`${sliderId}-desc`} className="text-muted-foreground text-xs">
            {description}
          </p>
        )}
        <Slider
          id={sliderId}
          value={[Number(value) || field.minimum]}
          min={field.minimum}
          max={field.maximum}
          step={1}
          onValueChange={([newValue]) => onChange(fieldKey, newValue)}
          disabled={disabled}
          aria-describedby={description ? `${sliderId}-desc` : undefined}
        />
      </div>
    );
  }

  // Number field - render as number input
  if (field.type === "number" || field.type === "integer") {
    return (
      <NumberInput
        key={fieldKey}
        name={id}
        label={label}
        description={description}
        required={isRequired}
        disabled={disabled}
        value={Number(value) || 0}
        onChange={(newValue) => onChange(fieldKey, newValue)}
        min={field.minimum}
        max={field.maximum}
      />
    );
  }

  // String field - render as text input
  return (
    <TextInput
      key={fieldKey}
      name={id}
      label={label}
      description={description}
      required={isRequired}
      disabled={disabled}
      value={
        typeof value === "object"
          ? JSON.stringify(value)
          : String((value as string | number) ?? "")
      }
      onChange={(newValue) => onChange(fieldKey, newValue)}
      maxLength={field.maxLength}
    />
  );
}
