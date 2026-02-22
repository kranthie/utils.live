import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Code to strip comments from"),
});

const outputSchema = z.object({
  output: z.string().describe("Code with comments removed"),
  commentsRemoved: z.number().describe("Number of comments removed"),
});

const optionsSchema = z.object({
  language: z
    .enum(["auto", "javascript", "css", "html", "python", "sql"])
    .default("auto")
    .describe("Language for comment detection"),
  preserveJsdoc: z
    .boolean()
    .default(false)
    .describe("Preserve JSDoc comments (/** ... */)"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function detectLanguage(code: string): string {
  if (/<[a-zA-Z]/.test(code) && /<\/[a-zA-Z]/.test(code)) return "html";
  if (/[{}]\s*[a-z-]+\s*:/.test(code) && !/function\b/.test(code)) return "css";
  if (/^(def |import |class |from |print\()/m.test(code)) return "python";
  if (/^(SELECT|INSERT|CREATE|ALTER)\b/im.test(code)) return "sql";
  return "javascript";
}

function execute(input: Input, options?: Options): Output {
  const raw = input.input;
  if (!raw.trim()) throw new Error("Input cannot be empty");

  const lang =
    options?.language === "auto" || !options?.language
      ? detectLanguage(raw)
      : options.language;
  const preserveJsdoc = options?.preserveJsdoc ?? false;

  let result = raw;
  let count = 0;

  switch (lang) {
    case "javascript":
    case "css": {
      // Remove block comments
      if (preserveJsdoc) {
        // Remove only non-JSDoc block comments
        result = result.replace(/\/\*(?!\*[\s\S])([\s\S]*?)\*\//g, () => {
          count++;
          return "";
        });
      } else {
        const blockMatches = result.match(/\/\*[\s\S]*?\*\//g);
        count += blockMatches?.length ?? 0;
        result = result.replace(/\/\*[\s\S]*?\*\//g, "");
      }
      // Remove single-line comments (JS only, not CSS)
      if (lang === "javascript") {
        const lineMatches = result.match(/\/\/[^\n]*/g);
        count += lineMatches?.length ?? 0;
        result = result.replace(/\/\/[^\n]*/g, "");
      }
      break;
    }
    case "html": {
      const htmlMatches = result.match(/<!--[\s\S]*?-->/g);
      count += htmlMatches?.length ?? 0;
      result = result.replace(/<!--[\s\S]*?-->/g, "");
      break;
    }
    case "python": {
      // Remove # comments
      const pyLineMatches = result.match(/#[^\n]*/g);
      count += pyLineMatches?.length ?? 0;
      result = result.replace(/#[^\n]*/g, "");
      // Remove docstrings (triple quotes)
      const docMatches = result.match(/"""[\s\S]*?"""|'''[\s\S]*?'''/g);
      count += docMatches?.length ?? 0;
      result = result.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, "");
      break;
    }
    case "sql": {
      // Remove -- comments
      const sqlLineMatches = result.match(/--[^\n]*/g);
      count += sqlLineMatches?.length ?? 0;
      result = result.replace(/--[^\n]*/g, "");
      // Remove /* */ comments
      const sqlBlockMatches = result.match(/\/\*[\s\S]*?\*\//g);
      count += sqlBlockMatches?.length ?? 0;
      result = result.replace(/\/\*[\s\S]*?\*\//g, "");
      break;
    }
  }

  // Clean up extra blank lines
  result = result.replace(/\n{3,}/g, "\n\n");
  result = result.replace(/^\s*\n/gm, (match) => match); // Keep intentional blank lines

  return { output: result, commentsRemoved: count };
}

export const commentStripper = defineTool({
  meta: {
    id: "code/comment-stripper",
    name: "Comment Stripper",
    description:
      "Free online comment stripper — remove single-line, block, and doc comments from JavaScript, CSS, HTML, Python, and SQL code instantly in your browser. No data is stored. Supports auto-detection and JSDoc preservation.",
    category: "code",
    subgroup: "Analysis",
    tier: ToolTier.CLIENT,
    keywords: ["comment", "strip", "remove", "clean", "code"],
    examples: [
      {
        title: "Strip JavaScript comments",
        description: "Remove single-line and block comments from JS code",
        input:
          "// Initialize counter\nlet count = 0;\n/* Increment\n   the counter */\ncount++;",
        output: "\nlet count = 0;\n\ncount++;",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
