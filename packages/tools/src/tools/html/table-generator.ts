import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  rows: z.number().int().min(1).max(100).default(3).describe("Number of rows"),
  columns: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(3)
    .describe("Number of columns"),
  headers: z
    .string()
    .default("")
    .describe("Comma-separated header names (leave empty for default)"),
  data: z
    .string()
    .default("")
    .describe("Table data: rows separated by newlines, cells by commas"),
  includeHead: z.boolean().default(true).describe("Include thead section"),
  includeBody: z.boolean().default(true).describe("Include tbody section"),
  bordered: z.boolean().default(true).describe("Add border styling"),
  striped: z.boolean().default(false).describe("Add striped row styling"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated HTML table"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const rows = input.rows;
  const columns = input.columns;
  const bordered = input.bordered;
  const striped = input.striped;

  // Parse headers
  let headerCells: string[] = [];
  if (input.headers.trim()) {
    headerCells = input.headers.split(",").map((h) => h.trim());
  } else {
    for (let i = 0; i < columns; i++) {
      headerCells.push(`Header ${i + 1}`);
    }
  }

  // Ensure headers match columns
  while (headerCells.length < columns) {
    headerCells.push(`Header ${headerCells.length + 1}`);
  }
  headerCells = headerCells.slice(0, columns);

  // Parse data
  let dataRows: string[][] = [];
  if (input.data.trim()) {
    dataRows = input.data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.split(",").map((cell) => cell.trim()));
  }

  // Fill in missing rows/cells
  while (dataRows.length < rows) {
    const row: string[] = [];
    for (let j = 0; j < columns; j++) {
      row.push(`Cell ${dataRows.length + 1}-${j + 1}`);
    }
    dataRows.push(row);
  }
  dataRows = dataRows.slice(0, rows);
  dataRows = dataRows.map((row) => {
    while (row.length < columns) {
      row.push("");
    }
    return row.slice(0, columns);
  });

  // Build style
  const styles: string[] = [];
  if (bordered) {
    styles.push("border-collapse: collapse");
  }

  // Build HTML
  const lines: string[] = [];
  const styleAttr = styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
  lines.push(`<table${styleAttr}>`);

  if (input.includeHead) {
    lines.push("  <thead>");
    lines.push("    <tr>");
    for (const header of headerCells) {
      const thStyle = bordered
        ? ' style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left"'
        : "";
      lines.push(`      <th${thStyle}>${header}</th>`);
    }
    lines.push("    </tr>");
    lines.push("  </thead>");
  }

  if (input.includeBody) {
    lines.push("  <tbody>");
    for (let i = 0; i < dataRows.length; i++) {
      const bgStyle =
        striped && i % 2 === 1 ? " background-color: #f9f9f9;" : "";
      const trStyle = bgStyle ? ` style="${bgStyle.trim()}"` : "";
      lines.push(`    <tr${trStyle}>`);
      for (const cell of dataRows[i]!) {
        const tdStyle = bordered
          ? ' style="border: 1px solid #ddd; padding: 8px"'
          : "";
        lines.push(`      <td${tdStyle}>${cell}</td>`);
      }
      lines.push("    </tr>");
    }
    lines.push("  </tbody>");
  }

  lines.push("</table>");

  return { output: lines.join("\n") };
}

export const htmlTableGenerator = defineTool({
  meta: {
    id: "html/table-generator",
    name: "HTML Table Generator",
    description:
      "Free online HTML table generator — create styled HTML tables instantly in your browser. No data is stored. Configurable rows, columns, headers, cell data, border styling, and striped rows with ready-to-copy output.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "html",
      "table",
      "generator",
      "rows",
      "columns",
      "data",
      "bordered",
      "striped",
      "thead",
      "tbody",
    ],
    examples: [
      {
        title: "Product inventory table",
        description:
          "Create a bordered HTML table with custom headers and product data",
        input: {
          rows: 2,
          columns: 3,
          headers: "Product,Price,Stock",
          data: "Widget,$9.99,150\nGadget,$24.99,42",
          includeHead: true,
          includeBody: true,
          bordered: true,
          striped: false,
        },
        output: `<table style="border-collapse: collapse">\n  <thead>\n    <tr>\n      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left">Product</th>\n      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left">Price</th>\n      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left">Stock</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td style="border: 1px solid #ddd; padding: 8px">Widget</td>\n      <td style="border: 1px solid #ddd; padding: 8px">$9.99</td>\n      <td style="border: 1px solid #ddd; padding: 8px">150</td>\n    </tr>\n    <tr>\n      <td style="border: 1px solid #ddd; padding: 8px">Gadget</td>\n      <td style="border: 1px solid #ddd; padding: 8px">$24.99</td>\n      <td style="border: 1px solid #ddd; padding: 8px">42</td>\n    </tr>\n  </tbody>\n</table>`,
      },
    ],
    ui: {
      outputRenderer: "html",
      outputLanguage: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
