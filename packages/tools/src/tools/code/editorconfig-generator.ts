import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  indentStyle: z
    .enum(["space", "tab"])
    .default("space")
    .describe("Indent style"),
  indentSize: z.number().min(1).max(8).default(2).describe("Indent size"),
  endOfLine: z.enum(["lf", "crlf", "cr"]).default("lf").describe("Line ending"),
  charset: z
    .enum(["utf-8", "utf-8-bom", "utf-16be", "utf-16le", "latin1"])
    .default("utf-8")
    .describe("Character set"),
  trimTrailingWhitespace: z
    .boolean()
    .default(true)
    .describe("Trim trailing whitespace"),
  insertFinalNewline: z
    .boolean()
    .default(true)
    .describe("Insert final newline"),
  maxLineLength: z
    .number()
    .min(0)
    .max(500)
    .default(120)
    .describe("Max line length (0 for off)"),
  includeMarkdown: z
    .boolean()
    .default(true)
    .describe("Include Markdown-specific rules"),
  includeMakefile: z
    .boolean()
    .default(true)
    .describe("Include Makefile-specific rules"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated .editorconfig content"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const lines: string[] = [];
  lines.push("# EditorConfig - https://editorconfig.org");
  lines.push("root = true");
  lines.push("");
  lines.push("[*]");
  lines.push(`indent_style = ${input.indentStyle}`);
  lines.push(`indent_size = ${input.indentSize}`);
  lines.push(`end_of_line = ${input.endOfLine}`);
  lines.push(`charset = ${input.charset}`);
  lines.push(`trim_trailing_whitespace = ${input.trimTrailingWhitespace}`);
  lines.push(`insert_final_newline = ${input.insertFinalNewline}`);
  if (input.maxLineLength > 0) {
    lines.push(`max_line_length = ${input.maxLineLength}`);
  }

  if (input.includeMarkdown) {
    lines.push("");
    lines.push("[*.md]");
    lines.push("trim_trailing_whitespace = false");
    lines.push(`max_line_length = off`);
  }

  if (input.includeMakefile) {
    lines.push("");
    lines.push("[Makefile]");
    lines.push("indent_style = tab");
  }

  lines.push("");
  lines.push("[*.{json,yml,yaml}]");
  lines.push("indent_size = 2");

  lines.push("");
  lines.push("[*.{css,scss,less}]");
  lines.push(`indent_size = ${input.indentSize}`);

  return { output: lines.join("\n") };
}

export const editorconfigGenerator = defineTool({
  meta: {
    id: "code/editorconfig-generator",
    name: ".editorconfig Generator",
    description:
      "Free online .editorconfig generator — create EditorConfig files with indent style, charset, line endings, and file-type-specific rules instantly in your browser. No data is stored. Includes Markdown and Makefile overrides.",
    category: "code",
    subgroup: "Config Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "editorconfig",
      "editor",
      "config",
      "generate",
      "indent",
      "formatting",
    ],
    examples: [
      {
        title: "Standard web project config",
        description: "Generate an .editorconfig with 2-space indentation",
        input: {
          indentStyle: "space",
          indentSize: 2,
          endOfLine: "lf",
          charset: "utf-8",
          trimTrailingWhitespace: true,
          insertFinalNewline: true,
          maxLineLength: 120,
          includeMarkdown: true,
          includeMakefile: false,
        },
        output:
          "# EditorConfig - https://editorconfig.org\nroot = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true\nmax_line_length = 120\n\n[*.md]\ntrim_trailing_whitespace = false\nmax_line_length = off\n\n[*.{json,yml,yaml}]\nindent_size = 2\n\n[*.{css,scss,less}]\nindent_size = 2",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
