"use client";

import { useCallback, useMemo } from "react";
import { Settings2 } from "lucide-react";
import type { SchemaField } from "./schema-field-renderer";
import { SchemaFieldRenderer } from "./schema-field-renderer";
import { cn } from "@/lib/utils";

interface ToolOptionsSchema {
  type: "object";
  properties: Record<string, SchemaField>;
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

  if (fields.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No configurable options for this tool.
      </p>
    );
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
        {fields.map(({ key, field, isRequired, value }) => (
          <SchemaFieldRenderer
            key={key}
            fieldKey={key}
            field={field}
            isRequired={isRequired}
            value={value}
            disabled={disabled}
            onChange={updateValue}
          />
        ))}
      </div>
    </div>
  );
}
