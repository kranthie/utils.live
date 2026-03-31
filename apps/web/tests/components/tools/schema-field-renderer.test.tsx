import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SchemaFieldRenderer,
  type SchemaField,
} from "@/components/tools/schema-field-renderer";

// Mock child components that use browser APIs or complex Radix internals
vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    id,
    checked,
    onCheckedChange,
    disabled,
  }: {
    id: string;
    checked: boolean;
    onCheckedChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: ({
    id,
    value,
    onValueChange,
    disabled,
    min,
    max,
    "aria-describedby": ariaDescribedby,
  }: {
    id: string;
    value: number[];
    onValueChange: (v: number[]) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
    "aria-describedby"?: string;
  }) => (
    <input
      type="range"
      id={id}
      value={value[0]}
      disabled={disabled}
      min={min}
      max={max}
      aria-describedby={ariaDescribedby}
      onChange={(e) => onValueChange([Number(e.target.value)])}
    />
  ),
}));

vi.mock("@/components/forms/text-input", () => ({
  TextInput: ({
    name,
    label,
    value,
    onChange,
    disabled,
    required,
  }: {
    name: string;
    label?: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    required?: boolean;
  }) => (
    <div>
      {label && (
        <label htmlFor={name}>
          {label}
          {required && " *"}
        </label>
      )}
      <input
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

vi.mock("@/components/forms/number-input", () => ({
  NumberInput: ({
    name,
    label,
    value,
    onChange,
    disabled,
    required,
  }: {
    name: string;
    label?: string;
    value: number;
    onChange: (v: number) => void;
    disabled?: boolean;
    required?: boolean;
  }) => (
    <div>
      {label && (
        <label htmlFor={name}>
          {label}
          {required && " *"}
        </label>
      )}
      <input
        id={name}
        name={name}
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  ),
}));

vi.mock("@/components/forms/searchable-select", () => ({
  SearchableSelect: ({
    name,
    label,
    value,
    onChange,
    disabled,
    options,
  }: {
    name: string;
    label?: string;
    value: string | null;
    onChange: (v: string) => void;
    disabled?: boolean;
    options: { value: string; label: string }[];
  }) => (
    <div>
      {label && <label htmlFor={name}>{label}</label>}
      <select
        id={name}
        name={name}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe("SchemaFieldRenderer", () => {
  const noop = vi.fn();

  beforeEach(() => {
    noop.mockClear();
  });

  describe("boolean field", () => {
    const field: SchemaField = {
      type: "boolean",
      title: "Enable Feature",
      description: "Toggle this on to activate",
    };

    it("renders a switch with the field label", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          onChange={noop}
        />
      );
      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText("Enable Feature")).toBeInTheDocument();
    });

    it("uses fieldKey as id by default", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          onChange={noop}
        />
      );
      expect(screen.getByRole("switch")).toHaveAttribute("id", "enabled");
    });

    it("applies idPrefix to the element id", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          idPrefix="gen-"
          onChange={noop}
        />
      );
      expect(screen.getByRole("switch")).toHaveAttribute("id", "gen-enabled");
    });

    it("reflects checked state from value prop", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={true}
          onChange={noop}
        />
      );
      expect(screen.getByRole("switch")).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });

    it("calls onChange with fieldKey and toggled value when clicked", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          onChange={noop}
        />
      );
      fireEvent.click(screen.getByRole("switch"));
      expect(noop).toHaveBeenCalledWith("enabled", true);
    });

    it("shows description when provided", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          onChange={noop}
        />
      );
      expect(
        screen.getByText("Toggle this on to activate")
      ).toBeInTheDocument();
    });

    it("renders required asterisk when isRequired is true", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={true}
          value={false}
          onChange={noop}
        />
      );
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("disables the switch when disabled prop is true", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="enabled"
          field={field}
          isRequired={false}
          value={false}
          disabled={true}
          onChange={noop}
        />
      );
      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("uses fieldKey as label when title is absent", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="myFlag"
          field={{ type: "boolean" }}
          isRequired={false}
          value={false}
          onChange={noop}
        />
      );
      expect(screen.getByText("My Flag")).toBeInTheDocument();
    });
  });

  describe("enum field", () => {
    const field: SchemaField = {
      type: "string",
      title: "Format",
      enum: ["json", "xml", "csv"],
      enumNames: ["JSON", "XML", "CSV"],
    };

    it("renders a select for enum fields", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="format"
          field={field}
          isRequired={false}
          value="json"
          onChange={noop}
        />
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("uses idPrefix for the select name", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="format"
          field={field}
          isRequired={false}
          value="json"
          idPrefix="gen-"
          onChange={noop}
        />
      );
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "name",
        "gen-format"
      );
    });

    it("calls onChange with fieldKey and selected value", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="format"
          field={field}
          isRequired={false}
          value="json"
          onChange={noop}
        />
      );
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "xml" },
      });
      expect(noop).toHaveBeenCalledWith("format", "xml");
    });
  });

  describe("slider field (number with range)", () => {
    const field: SchemaField = {
      type: "integer",
      title: "Count",
      minimum: 1,
      maximum: 100,
      description: "Number of items",
    };

    it("renders a range slider", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="count"
          field={field}
          isRequired={false}
          value={10}
          onChange={noop}
        />
      );
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    it("uses idPrefix for slider id", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="count"
          field={field}
          isRequired={false}
          value={10}
          idPrefix="gen-"
          onChange={noop}
        />
      );
      expect(screen.getByRole("slider")).toHaveAttribute(
        "id",
        "gen-slider-count"
      );
    });

    it("sets aria-describedby when description is provided", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="count"
          field={field}
          isRequired={false}
          value={10}
          onChange={noop}
        />
      );
      expect(screen.getByRole("slider")).toHaveAttribute(
        "aria-describedby",
        "slider-count-desc"
      );
    });

    it("calls onChange with fieldKey and new numeric value", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="count"
          field={field}
          isRequired={false}
          value={10}
          onChange={noop}
        />
      );
      fireEvent.change(screen.getByRole("slider"), { target: { value: "42" } });
      expect(noop).toHaveBeenCalledWith("count", 42);
    });
  });

  describe("number field (no range)", () => {
    const field: SchemaField = {
      type: "number",
      title: "Precision",
    };

    it("renders a number input", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="precision"
          field={field}
          isRequired={false}
          value={2}
          onChange={noop}
        />
      );
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("applies idPrefix to the number input name", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="precision"
          field={field}
          isRequired={false}
          value={2}
          idPrefix="gen-"
          onChange={noop}
        />
      );
      expect(screen.getByRole("spinbutton")).toHaveAttribute(
        "name",
        "gen-precision"
      );
    });

    it("calls onChange with fieldKey and numeric value", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="precision"
          field={field}
          isRequired={false}
          value={2}
          onChange={noop}
        />
      );
      fireEvent.change(screen.getByRole("spinbutton"), {
        target: { value: "5" },
      });
      expect(noop).toHaveBeenCalledWith("precision", 5);
    });
  });

  describe("string field", () => {
    const field: SchemaField = {
      type: "string",
      title: "Separator",
    };

    it("renders a text input", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="separator"
          field={field}
          isRequired={false}
          value=","
          onChange={noop}
        />
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("applies idPrefix to text input name", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="separator"
          field={field}
          isRequired={false}
          value=","
          idPrefix="gen-"
          onChange={noop}
        />
      );
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "name",
        "gen-separator"
      );
    });

    it("stringifies object values", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="config"
          field={{ type: "string", title: "Config" }}
          isRequired={false}
          value={{ key: "val" }}
          onChange={noop}
        />
      );
      expect(screen.getByRole("textbox")).toHaveValue('{"key":"val"}');
    });

    it("calls onChange with fieldKey and new string value", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="separator"
          field={field}
          isRequired={false}
          value=","
          onChange={noop}
        />
      );
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "|" } });
      expect(noop).toHaveBeenCalledWith("separator", "|");
    });
  });

  describe("disabled state", () => {
    it("disabled=false is the default", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="val"
          field={{ type: "string", title: "Val" }}
          isRequired={false}
          value=""
          onChange={noop}
        />
      );
      expect(screen.getByRole("textbox")).not.toBeDisabled();
    });

    it("disables the number input when disabled=true", () => {
      render(
        <SchemaFieldRenderer
          fieldKey="n"
          field={{ type: "number", title: "N" }}
          isRequired={false}
          value={0}
          disabled={true}
          onChange={noop}
        />
      );
      expect(screen.getByRole("spinbutton")).toBeDisabled();
    });
  });
});
