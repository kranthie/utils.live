import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Code to analyze"),
});

const outputSchema = z.object({
  output: z.string().describe("Line count analysis"),
  totalLines: z.number(),
  codeLines: z.number(),
  commentLines: z.number(),
  blankLines: z.number(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) throw new Error("Input cannot be empty");

  const lines = raw.split("\n");
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      blankLines++;
      continue;
    }

    if (inBlockComment) {
      commentLines++;
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith("/*")) {
      commentLines++;
      if (!trimmed.includes("*/")) {
        inBlockComment = true;
      }
      continue;
    }

    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("--")
    ) {
      commentLines++;
      continue;
    }

    // Line with inline comment
    if (trimmed.includes("//") || trimmed.includes("/*")) {
      codeLines++; // Count as code since it has code too
      continue;
    }

    codeLines++;
  }

  const totalLines = lines.length;
  const codePercent =
    totalLines > 0 ? Math.round((codeLines / totalLines) * 100) : 0;
  const commentPercent =
    totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

  const output = [
    `Line Count Analysis`,
    `-------------------`,
    `Total lines:   ${totalLines}`,
    `Code lines:    ${codeLines} (${codePercent}%)`,
    `Comment lines: ${commentLines} (${commentPercent}%)`,
    `Blank lines:   ${blankLines} (${totalLines > 0 ? Math.round((blankLines / totalLines) * 100) : 0}%)`,
  ].join("\n");

  return { output, totalLines, codeLines, commentLines, blankLines };
}

export const lineCounter = defineTool({
  meta: {
    id: "code/line-counter",
    name: "Line Counter",
    description:
      "Free online line counter — count total lines, code lines, comment lines, and blank lines with percentage breakdown instantly in your browser. No data is stored. Detects single-line and block comments across languages.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: [
      "line",
      "count",
      "loc",
      "code",
      "comments",
      "blank",
      "statistics",
      "analyze",
      "sloc",
    ],
    examples: [
      {
        title: "Count lines in JavaScript",
        description: "Analyze code, comment, and blank line ratios",
        input:
          "// Setup\nconst app = express();\n\n// Routes\napp.get('/', handler);\napp.listen(3000);",
        output:
          "Line Count Analysis\n-------------------\nTotal lines:   6\nCode lines:    3 (50%)\nComment lines: 2 (33%)\nBlank lines:   1 (17%)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
