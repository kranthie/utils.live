import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to extract dates from"),
});

const outputSchema = z.object({
  dates: z
    .array(
      z.object({
        original: z.string().describe("Original date string"),
        parsed: z
          .union([z.string(), z.undefined()])
          .describe("Parsed ISO date"),
        format: z.string().describe("Detected format"),
      })
    )
    .describe("Extracted dates"),
  count: z.number().describe("Number of dates found"),
  unique: z.array(z.string()).describe("Unique date strings"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface DatePattern {
  regex: RegExp;
  format: string;
  parse: (match: string) => Date | null;
}

const DATE_PATTERNS: DatePattern[] = [
  // ISO format: 2023-12-25
  {
    regex: /\b\d{4}-\d{2}-\d{2}\b/g,
    format: "YYYY-MM-DD",
    parse: (m) => {
      const d = new Date(m);
      return isNaN(d.getTime()) ? null : d;
    },
  },
  // US format: 12/25/2023 or 12-25-2023
  {
    regex: /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/g,
    format: "MM/DD/YYYY",
    parse: (m) => {
      const parts = m.split(/[-/]/);
      if (parts.length !== 3) return null;
      const month = parseInt(parts[0] || "0", 10);
      const day = parseInt(parts[1] || "0", 10);
      const year = parseInt(parts[2] || "0", 10);
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d;
    },
  },
  // European format: 25/12/2023 or 25.12.2023
  {
    regex: /\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g,
    format: "DD/MM/YYYY",
    parse: (m) => {
      const parts = m.split(/[/.]/);
      if (parts.length !== 3) return null;
      const day = parseInt(parts[0] || "0", 10);
      const month = parseInt(parts[1] || "0", 10);
      const year = parseInt(parts[2] || "0", 10);
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d;
    },
  },
  // Written format: December 25, 2023 or Dec 25, 2023
  {
    regex:
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi,
    format: "Month DD, YYYY",
    parse: (m) => {
      const d = new Date(m);
      return isNaN(d.getTime()) ? null : d;
    },
  },
  // Relative: today, yesterday, tomorrow
  {
    regex: /\b(today|yesterday|tomorrow)\b/gi,
    format: "relative",
    parse: (m) => {
      const now = new Date();
      const lower = m.toLowerCase();
      if (lower === "today") return now;
      if (lower === "yesterday") {
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      if (lower === "tomorrow") {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
      return null;
    },
  },
];

/**
 * Extracts dates from text.
 */
function execute(input: Input): Output {
  const text = input.input;
  const dates: Output["dates"] = [];
  const seen = new Set<string>();

  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern.regex) || [];

    for (const match of matches) {
      if (seen.has(match.toLowerCase())) continue;
      seen.add(match.toLowerCase());

      const parsedDate = pattern.parse(match);
      const parsedStr = parsedDate
        ? parsedDate.toISOString().split("T")[0]
        : undefined;

      dates.push({
        original: match,
        parsed: parsedStr,
        format: pattern.format,
      });
    }
  }

  return {
    dates,
    count: dates.length,
    unique: [...seen],
  };
}

/**
 * Date Extractor tool.
 * Extracts dates from text.
 */
export const dateExtractor = defineTool({
  meta: {
    id: "text/date-extractor",
    name: "Date Extractor",
    description:
      "Free online date extractor — find and parse dates from any text instantly in your browser. No data is stored. Recognizes ISO, US, European, written, and relative date formats.",
    category: "text",
    subgroup: "Extraction",
    tier: ToolTier.CLIENT,
    keywords: ["date", "extract", "time", "calendar", "parse"],
    examples: [
      {
        title: "Extract dates from text",
        description: "Find dates in various formats within a paragraph",
        input:
          "The meeting is on 2024-01-15 and the deadline is March 20, 2024.",
        output:
          '{"dates":[{"original":"2024-01-15","parsed":"2024-01-15","format":"YYYY-MM-DD"},{"original":"March 20, 2024","parsed":"2024-03-20","format":"Month DD, YYYY"}],"count":2,"unique":["2024-01-15","march 20, 2024"]}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
