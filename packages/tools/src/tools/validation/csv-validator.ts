import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import Papa from "papaparse";

const inputSchema = z.object({
  input: z.string().describe("CSV string to validate"),
});
const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  isValid: z.boolean(),
  errors: z.array(z.string()).optional(),
});

export const csvValidator = defineTool({
  meta: {
    id: "validation/csv-validator",
    name: "CSV Validator",
    description:
      "Free online CSV validator — check your CSV data for format errors and column consistency instantly in your browser. No data is stored. Validates row structure, column counts, and reports total rows and columns.",
    category: "validation",
    subgroup: "Data Validators",
    tier: ToolTier.CLIENT,
    keywords: [
      "csv",
      "validate",
      "tabular",
      "data",
      "comma-separated",
      "spreadsheet",
      "columns",
      "rows",
    ],
    examples: [
      {
        title: "Valid CSV",
        description: "Validate a well-formed CSV with consistent columns",
        input:
          "name,email,age\nAlice,alice@example.com,30\nBob,bob@example.com,25",
        output: "Valid CSV (3 rows, 3 columns)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const text = input.input.trim();
    if (!text) {
      return {
        output: "Empty CSV",
        isValid: false,
        errors: ["No data provided"],
      };
    }

    const result = Papa.parse(text, {
      skipEmptyLines: false,
      delimiter: "", // auto-detect
    });

    const errors: string[] = [];

    // Collect parse errors from PapaParse
    for (const err of result.errors) {
      errors.push(`Row ${(err.row ?? 0) + 1}: ${err.message}`);
    }

    // Check for consistent column counts across all rows
    const data = result.data as string[][];
    if (data.length > 0) {
      const firstRowCols = data[0]!.length;
      for (let i = 1; i < data.length; i++) {
        const row = data[i]!;
        // Skip completely empty trailing rows
        if (row.length === 1 && row[0] === "" && i === data.length - 1) {
          continue;
        }
        if (row.length !== firstRowCols) {
          errors.push(
            `Row ${i + 1}: Expected ${firstRowCols} columns, got ${row.length}`
          );
        }
      }

      const isValid = errors.length === 0;
      const rowCount = data.filter(
        (row, idx) =>
          !(row.length === 1 && row[0] === "" && idx === data.length - 1)
      ).length;

      return {
        output: isValid
          ? `Valid CSV (${rowCount} rows, ${firstRowCols} columns)`
          : `CSV issues:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
        isValid,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    return {
      output: "Empty CSV",
      isValid: false,
      errors: ["No data provided"],
    };
  },
});
