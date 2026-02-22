import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  columns: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(3)
    .describe("Number of columns"),
  rows: z.number().int().min(1).max(12).default(2).describe("Number of rows"),
  columnGap: z.number().min(0).max(100).default(16).describe("Column gap (px)"),
  rowGap: z.number().min(0).max(100).default(16).describe("Row gap (px)"),
  columnSizing: z
    .enum(["equal", "auto", "custom"])
    .default("equal")
    .describe("Column sizing mode"),
  customColumns: z
    .string()
    .default("")
    .describe("Custom column template (e.g., '1fr 2fr 1fr')"),
  rowSizing: z
    .enum(["auto", "equal", "custom"])
    .default("auto")
    .describe("Row sizing mode"),
  customRows: z.string().default("").describe("Custom row template"),
  alignItems: z
    .enum(["start", "end", "center", "stretch"])
    .default("stretch")
    .describe("Align items"),
  justifyItems: z
    .enum(["start", "end", "center", "stretch"])
    .default("stretch")
    .describe("Justify items"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS and HTML for grid layout"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const {
    columns,
    rows,
    columnGap,
    rowGap,
    columnSizing,
    customColumns,
    rowSizing,
    customRows,
    alignItems,
    justifyItems,
  } = input;

  let gridTemplateColumns: string;
  switch (columnSizing) {
    case "equal":
      gridTemplateColumns = `repeat(${columns}, 1fr)`;
      break;
    case "auto":
      gridTemplateColumns = `repeat(${columns}, auto)`;
      break;
    case "custom":
      gridTemplateColumns = customColumns || `repeat(${columns}, 1fr)`;
      break;
  }

  let gridTemplateRows: string;
  switch (rowSizing) {
    case "equal":
      gridTemplateRows = `repeat(${rows}, 1fr)`;
      break;
    case "auto":
      gridTemplateRows = `repeat(${rows}, auto)`;
      break;
    case "custom":
      gridTemplateRows = customRows || `repeat(${rows}, auto)`;
      break;
  }

  const cssLines = [
    `/* Grid Container */`,
    `.grid-container {`,
    `  display: grid;`,
    `  grid-template-columns: ${gridTemplateColumns};`,
    `  grid-template-rows: ${gridTemplateRows};`,
    `  column-gap: ${columnGap}px;`,
    `  row-gap: ${rowGap}px;`,
    `  align-items: ${alignItems};`,
    `  justify-items: ${justifyItems};`,
    `}`,
    ``,
    `/* Grid Items */`,
    `.grid-item {`,
    `  padding: 16px;`,
    `  background-color: #4a90d9;`,
    `  color: white;`,
    `  border-radius: 4px;`,
    `  text-align: center;`,
    `}`,
  ];

  // HTML
  const totalItems = columns * rows;
  const htmlLines = [``, `<!-- HTML -->`, `<div class="grid-container">`];
  for (let i = 1; i <= totalItems; i++) {
    htmlLines.push(`  <div class="grid-item">Item ${i}</div>`);
  }
  htmlLines.push(`</div>`);

  return { output: [...cssLines, ...htmlLines].join("\n") };
}

export const cssGridGenerator = defineTool({
  meta: {
    id: "css/grid-generator",
    name: "CSS Grid Generator",
    description:
      "Free online CSS Grid generator — build grid layouts with configurable columns, rows, gaps, and alignment instantly in your browser. No data is stored. Supports equal, auto, and custom column/row sizing with ready-to-use CSS and HTML.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "grid",
      "layout",
      "generator",
      "columns",
      "rows",
      "responsive",
      "template",
    ],
    examples: [
      {
        title: "Photo gallery grid (3x2)",
        description:
          "Generate a 3-column, 2-row equal grid layout with 16px gaps",
        input: {
          columns: 3,
          rows: 2,
          columnGap: 16,
          rowGap: 16,
          columnSizing: "equal",
          customColumns: "",
          rowSizing: "auto",
          customRows: "",
          alignItems: "stretch",
          justifyItems: "stretch",
        },
        output:
          '{"output":"/* Grid Container */\\n.grid-container {\\n  display: grid;\\n  grid-template-columns: repeat(3, 1fr);\\n  grid-template-rows: repeat(2, auto);\\n  column-gap: 16px;\\n  row-gap: 16px;\\n  align-items: stretch;\\n  justify-items: stretch;\\n}\\n\\n/* Grid Items */\\n.grid-item {\\n  padding: 16px;\\n  background-color: #4a90d9;\\n  color: white;\\n  border-radius: 4px;\\n  text-align: center;\\n}\\n\\n<!-- HTML -->\\n<div class=\\"grid-container\\">\\n  <div class=\\"grid-item\\">Item 1</div>\\n  <div class=\\"grid-item\\">Item 2</div>\\n  <div class=\\"grid-item\\">Item 3</div>\\n  <div class=\\"grid-item\\">Item 4</div>\\n  <div class=\\"grid-item\\">Item 5</div>\\n  <div class=\\"grid-item\\">Item 6</div>\\n</div>"}',
      },
    ],
    ui: {
      outputRenderer: "code",
      outputLanguage: "css",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
