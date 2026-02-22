import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  direction: z
    .enum(["row", "row-reverse", "column", "column-reverse"])
    .default("row")
    .describe("Flex direction"),
  justifyContent: z
    .enum([
      "flex-start",
      "flex-end",
      "center",
      "space-between",
      "space-around",
      "space-evenly",
    ])
    .default("flex-start")
    .describe("Justify content"),
  alignItems: z
    .enum(["flex-start", "flex-end", "center", "stretch", "baseline"])
    .default("stretch")
    .describe("Align items"),
  flexWrap: z
    .enum(["nowrap", "wrap", "wrap-reverse"])
    .default("nowrap")
    .describe("Flex wrap"),
  gap: z.number().min(0).max(100).default(0).describe("Gap between items (px)"),
  itemCount: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(3)
    .describe("Number of flex items for preview"),
});

const outputSchema = z.object({
  output: z.string().describe("CSS and HTML for flexbox layout"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { direction, justifyContent, alignItems, flexWrap, gap, itemCount } =
    input;

  const cssLines = [
    `/* Flexbox Container */`,
    `.flex-container {`,
    `  display: flex;`,
    `  flex-direction: ${direction};`,
    `  justify-content: ${justifyContent};`,
    `  align-items: ${alignItems};`,
    `  flex-wrap: ${flexWrap};`,
  ];

  if (gap > 0) {
    cssLines.push(`  gap: ${gap}px;`);
  }

  cssLines.push(`}`);
  cssLines.push(``);
  cssLines.push(`/* Flex Items */`);
  cssLines.push(`.flex-item {`);
  cssLines.push(`  padding: 16px 24px;`);
  cssLines.push(`  background-color: #4a90d9;`);
  cssLines.push(`  color: white;`);
  cssLines.push(`  border-radius: 4px;`);
  cssLines.push(`  text-align: center;`);
  cssLines.push(`}`);

  // HTML preview
  const htmlLines = [``, `<!-- HTML -->`, `<div class="flex-container">`];
  for (let i = 1; i <= itemCount; i++) {
    htmlLines.push(`  <div class="flex-item">Item ${i}</div>`);
  }
  htmlLines.push(`</div>`);

  return { output: [...cssLines, ...htmlLines].join("\n") };
}

export const cssFlexboxGenerator = defineTool({
  meta: {
    id: "css/flexbox-generator",
    name: "CSS Flexbox Generator",
    description:
      "Free online CSS flexbox generator — build flex layouts with configurable direction, alignment, wrapping, and gap instantly in your browser. No data is stored. Generates ready-to-use CSS and HTML with flex container and item styles.",
    category: "css",
    tier: ToolTier.CLIENT,
    keywords: [
      "css",
      "flexbox",
      "flex",
      "layout",
      "generator",
      "container",
      "responsive",
    ],
    examples: [
      {
        title: "Centered row layout with gap",
        description:
          "Generate a wrapping flexbox row that centers items with 16px gap",
        input: {
          direction: "row",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          itemCount: 3,
        },
        output:
          '{"output":"/* Flexbox Container */\\n.flex-container {\\n  display: flex;\\n  flex-direction: row;\\n  justify-content: center;\\n  align-items: center;\\n  flex-wrap: wrap;\\n  gap: 16px;\\n}\\n\\n/* Flex Items */\\n.flex-item {\\n  padding: 16px 24px;\\n  background-color: #4a90d9;\\n  color: white;\\n  border-radius: 4px;\\n  text-align: center;\\n}\\n\\n<!-- HTML -->\\n<div class=\\"flex-container\\">\\n  <div class=\\"flex-item\\">Item 1</div>\\n  <div class=\\"flex-item\\">Item 2</div>\\n  <div class=\\"flex-item\\">Item 3</div>\\n</div>"}',
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
