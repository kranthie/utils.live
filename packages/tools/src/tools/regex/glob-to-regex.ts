import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Glob pattern to convert"),
});

const optionsSchema = z.object({
  extended: z
    .boolean()
    .default(true)
    .describe("Support extended glob features ({}, etc.)"),
  matchBase: z
    .boolean()
    .default(false)
    .describe("Match basename only (no directory separators)"),
});

const outputSchema = z.object({
  output: z.string().describe("Equivalent regex pattern"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input, options?: Options): Output {
  const glob = input.input;
  if (!glob) throw new Error("Glob pattern cannot be empty");

  const extended = options?.extended ?? true;
  let regex = "";
  let inGroup = false;
  let i = 0;

  while (i < glob.length) {
    const ch = glob[i]!;

    switch (ch) {
      case "\\":
        if (i + 1 < glob.length) {
          regex += "\\" + glob[i + 1];
          i += 2;
        } else {
          regex += "\\\\";
          i++;
        }
        break;

      case "*":
        if (glob[i + 1] === "*") {
          if (glob[i + 2] === "/") {
            // **/ matches zero or more directories
            regex += "(?:[^/]*(?:/|$))*";
            i += 3;
          } else {
            // ** matches everything
            regex += ".*";
            i += 2;
          }
        } else {
          // * matches anything except /
          regex += "[^/]*";
          i++;
        }
        break;

      case "?":
        regex += "[^/]";
        i++;
        break;

      case "[":
        // Character class
        regex += "[";
        i++;
        if (i < glob.length && glob[i] === "!") {
          regex += "^";
          i++;
        }
        while (i < glob.length && glob[i] !== "]") {
          regex += glob[i];
          i++;
        }
        regex += "]";
        i++; // skip ]
        break;

      case "{":
        if (extended) {
          regex += "(";
          inGroup = true;
          i++;
        } else {
          regex += "\\{";
          i++;
        }
        break;

      case "}":
        if (extended && inGroup) {
          regex += ")";
          inGroup = false;
          i++;
        } else {
          regex += "\\}";
          i++;
        }
        break;

      case ",":
        if (inGroup) {
          regex += "|";
          i++;
        } else {
          regex += "\\,";
          i++;
        }
        break;

      // Escape regex special characters
      case ".":
      case "+":
      case "^":
      case "$":
      case "(":
      case ")":
      case "|":
        regex += "\\" + ch;
        i++;
        break;

      default:
        regex += ch;
        i++;
    }
  }

  const finalRegex = `^${regex}$`;

  return { output: finalRegex };
}

export const globToRegex = defineTool({
  meta: {
    id: "regex/glob-to-regex",
    name: "Glob to Regex",
    description:
      "Free online glob to regex converter — convert glob wildcard patterns to equivalent regular expressions instantly in your browser. No data is stored. Supports extended globs, brace expansion, and character classes.",
    category: "regex",
    subgroup: "Regex Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "glob",
      "regex",
      "convert",
      "pattern",
      "wildcard",
      "file",
      "match",
      "shell",
      "minimatch",
    ],
    examples: [
      {
        title: "Convert TypeScript file glob to regex",
        description: "Convert a glob pattern for TypeScript files to regex",
        input: "*.ts",
        output: "^[^/]*\\.ts$",
      },
      {
        title: "Match Multiple Extensions",
        description: "Convert a glob with brace expansion to regex",
        input: "*.{js,ts,jsx,tsx}",
        output: "^[^/]*\\.(js|ts|jsx|tsx)$",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
