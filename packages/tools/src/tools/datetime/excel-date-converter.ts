import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Excel serial date number or date string"),
});

const outputSchema = z.object({
  output: z.string().describe("Conversion result"),
  excelSerial: z.number().describe("Excel serial date"),
  iso: z.string().describe("ISO date string"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Excel epoch: December 30, 1899 (accounting for Excel's leap year bug)
const EXCEL_EPOCH = new Date(1899, 11, 30).getTime();
const MS_PER_DAY = 86400000;

function execute(input: Input): Output {
  const str = input.input.trim();
  if (!str) throw new Error("Input cannot be empty");

  const num = Number(str);

  // If it's a small positive number, treat as Excel serial date
  if (!isNaN(num) && num > 0 && num < 2958466) {
    // Max is ~9999-12-31
    const ms = EXCEL_EPOCH + num * MS_PER_DAY;
    const date = new Date(ms);
    return {
      output: `Excel serial ${num} = ${date.toISOString().split("T")[0]}`,
      excelSerial: num,
      iso: date.toISOString(),
    };
  }

  // Try parsing as date string
  let date: Date;
  if (!isNaN(num)) {
    date = num < 4102444800 ? new Date(num * 1000) : new Date(num);
  } else {
    date = new Date(str);
  }

  if (isNaN(date.getTime())) {
    throw new Error("Unable to parse input");
  }

  const serial = (date.getTime() - EXCEL_EPOCH) / MS_PER_DAY;
  return {
    output: `${date.toISOString().split("T")[0]} = Excel serial ${serial.toFixed(6)}`,
    excelSerial: Math.round(serial * 1000000) / 1000000,
    iso: date.toISOString(),
  };
}

export const excelDateConverter = defineTool({
  meta: {
    id: "datetime/excel-date-converter",
    name: "Excel Date Converter",
    description:
      "Free online Excel date converter — convert between Excel serial date numbers and calendar dates instantly in your browser. No data is stored. Handles the Excel leap year bug for accuracy.",
    category: "datetime",
    subgroup: "Date Conversion",
    tier: ToolTier.CLIENT,
    keywords: ["excel", "serial", "date", "convert", "spreadsheet"],
    examples: [
      {
        title: "Excel Serial to Date",
        description: "Convert an Excel serial date number to a calendar date",
        input: "45658",
        output: "Excel serial 45658 = 2025-01-01",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
