import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text with whitespace to clean"),
});

const outputSchema = z.object({
  output: z.string().describe("Cleaned text"),
  stats: z.object({
    originalLength: z.number(),
    resultLength: z.number(),
    spacesRemoved: z.number(),
    tabsConverted: z.number(),
  }),
});

const optionsSchema = z.object({
  normalizeSpaces: z
    .boolean()
    .default(true)
    .describe("Convert multiple spaces to single"),
  convertTabs: z.boolean().default(true).describe("Convert tabs to spaces"),
  tabWidth: z.number().int().min(1).max(8).default(4).describe("Tab width"),
  trimLines: z.boolean().default(true).describe("Trim whitespace from lines"),
  trimDocument: z
    .boolean()
    .default(true)
    .describe("Trim start/end of document"),
  normalizeLineEndings: z
    .boolean()
    .default(true)
    .describe("Normalize line endings to LF"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

/**
 * Cleans and normalizes whitespace.
 */
function execute(input: Input, options?: Options): Output {
  const normalizeSpaces = options?.normalizeSpaces ?? true;
  const convertTabs = options?.convertTabs ?? true;
  const tabWidth = options?.tabWidth ?? 4;
  const trimLines = options?.trimLines ?? true;
  const trimDocument = options?.trimDocument ?? true;
  const normalizeLineEndings = options?.normalizeLineEndings ?? true;

  let text = input.input;
  const originalLength = text.length;
  let tabsConverted = 0;

  // Normalize line endings first
  if (normalizeLineEndings) {
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  // Convert tabs
  if (convertTabs) {
    const tabMatches = text.match(/\t/g);
    tabsConverted = tabMatches ? tabMatches.length : 0;
    text = text.replace(/\t/g, " ".repeat(tabWidth));
  }

  // Process lines
  if (trimLines || normalizeSpaces) {
    const lines = text.split("\n");
    const processed = lines.map((line) => {
      let result = line;
      if (trimLines) {
        result = result.trim();
      }
      if (normalizeSpaces) {
        result = result.replace(/ {2,}/g, " ");
      }
      return result;
    });
    text = processed.join("\n");
  }

  // Trim document
  if (trimDocument) {
    text = text.trim();
  }

  const resultLength = text.length;
  const spacesRemoved =
    originalLength - resultLength - tabsConverted * (tabWidth - 1);

  return {
    output: text,
    stats: {
      originalLength,
      resultLength,
      spacesRemoved: Math.max(0, spacesRemoved),
      tabsConverted,
    },
  };
}

/**
 * Whitespace Cleaner tool.
 * Normalizes whitespace in text.
 */
export const whitespaceCleaner = defineTool({
  meta: {
    id: "text/whitespace-cleaner",
    name: "Whitespace Cleaner",
    description:
      "Free online whitespace cleaner — normalize spaces, tabs, and line endings in text instantly in your browser. No data is stored. Converts multiple spaces to single, tabs to spaces, trims lines, and normalizes line endings.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["whitespace", "clean", "normalize", "spaces", "tabs"],
    examples: [
      {
        title: "Clean up messy whitespace",
        description: "Normalize tabs, multiple spaces, and line endings",
        input: "hello   world\t\tfoo\n  bar  ",
        output: "hello world foo\nbar",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
