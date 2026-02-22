import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import {
  minifyCLikeCode,
  minifyCss,
  minifyHtml,
  minifyJson,
  minifySql,
  minifyXml,
  getByteSize,
  calcReduction,
} from "./_minify-utils";

const inputSchema = z.object({
  input: z.string().describe("Code to minify (auto-detected format)"),
});

const outputSchema = z.object({
  output: z.string().describe("Minified code"),
  detectedFormat: z.string().describe("Auto-detected format"),
  originalSize: z.number(),
  minifiedSize: z.number(),
  reduction: z.number(),
});

const optionsSchema = z.object({
  format: z
    .enum(["auto", "javascript", "css", "html", "json", "xml", "sql"])
    .default("auto")
    .describe("Force a specific format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function detectFormat(code: string): string {
  const trimmed = code.trim();
  // JSON
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      /* not json */
    }
  }
  // HTML
  if (/<(!DOCTYPE|html|head|body|div|p|span|a|img)\b/i.test(trimmed))
    return "html";
  // XML
  if (
    trimmed.startsWith("<?xml") ||
    (trimmed.startsWith("<") &&
      /<\/\w+>/.test(trimmed) &&
      !/<(!DOCTYPE|html|head|body)\b/i.test(trimmed))
  )
    return "xml";
  // CSS
  if (
    /[.#@]\w+\s*\{|[a-z-]+\s*:\s*[^;]+;/i.test(trimmed) &&
    !/function\b/.test(trimmed)
  )
    return "css";
  // SQL
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(trimmed))
    return "sql";
  // Default to JavaScript
  return "javascript";
}

function execute(input: Input, options?: Options): Output {
  if (!input.input.trim()) throw new Error("Input cannot be empty");

  const format =
    options?.format === "auto" || !options?.format
      ? detectFormat(input.input)
      : options.format;

  let output: string;
  switch (format) {
    case "json":
      output = minifyJson(input.input);
      break;
    case "css":
      output = minifyCss(input.input);
      break;
    case "html":
      output = minifyHtml(input.input);
      break;
    case "xml":
      output = minifyXml(input.input);
      break;
    case "sql":
      output = minifySql(input.input);
      break;
    default:
      output = minifyCLikeCode(input.input);
      break;
  }

  return {
    output,
    detectedFormat: format,
    originalSize: getByteSize(input.input),
    minifiedSize: getByteSize(output),
    reduction: calcReduction(input.input, output),
  };
}

export const batchMinify = defineTool({
  meta: {
    id: "code/batch-minify",
    name: "Batch Minifier",
    description:
      "Free online batch code minifier — auto-detect and minify JavaScript, CSS, HTML, JSON, XML, or SQL code instantly in your browser. No data is stored. Shows original vs minified size with reduction percentage.",
    category: "code",
    subgroup: "Minifiers",
    tier: ToolTier.CLIENT,
    keywords: ["minify", "batch", "auto", "compress", "detect"],
    examples: [
      {
        title: "Auto-minify CSS",
        description: "Automatically detect and minify a CSS snippet",
        input:
          ".card {\n  padding: 16px;\n  margin: 8px;\n  border: 1px solid #ccc;\n}",
        output: ".card{padding:16px;margin:8px;border:1px solid #ccc}",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
