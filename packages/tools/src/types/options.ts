import type { OptionType } from "./enums";

/**
 * Constraint configuration for tool options.
 */
export interface OptionConstraints {
  /** Minimum value for number options */
  min?: number;
  /** Maximum value for number options */
  max?: number;
  /** Minimum length for string options */
  minLength?: number;
  /** Maximum length for string options */
  maxLength?: number;
  /** Pattern for string options (regex) */
  pattern?: string;
  /** Allowed values for select options */
  values?: readonly string[];
}

/**
 * Definition for a single tool option.
 *
 * Used for generating UI controls and documenting available options.
 */
export interface ToolOption {
  /** Option identifier */
  name: string;
  /** Data type */
  type: OptionType;
  /** Display label */
  label: string;
  /** Help text/description */
  description?: string;
  /** Default value */
  default: unknown;
  /** Whether the option is required */
  required?: boolean;
  /** Validation constraints */
  constraints?: OptionConstraints;
}

/**
 * Collection of tool options.
 */
export type ToolOptions = readonly ToolOption[];
