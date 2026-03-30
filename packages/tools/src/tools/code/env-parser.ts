import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe(".env file content to parse"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed environment variables in JSON format"),
});

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  const text = input.input.trim();
  if (!text) throw new Error("Input cannot be empty");

  const vars: Record<string, string> = {};
  const comments: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      if (trimmed.startsWith("#")) comments.push(trimmed);
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    // Remove surrounding quotes
    const wasQuoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (wasQuoted) {
      value = value.slice(1, -1);
    }

    // Remove inline comments — only for unquoted values
    if (!wasQuoted) {
      const commentIdx = value.indexOf(" #");
      if (commentIdx > 0) {
        value = value.substring(0, commentIdx).trim();
      }
    }

    vars[key] = value;
  }

  const result = {
    variables: vars,
    count: Object.keys(vars).length,
    comments: comments.length,
    keys: Object.keys(vars),
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const envParser = defineTool({
  meta: {
    id: "code/env-parser",
    name: ".env Parser",
    description:
      "Free online .env file parser — parse dotenv files into structured JSON with variable names, values, key count, and comment count instantly in your browser. No data is stored. Handles quoted values and inline comments.",
    category: "code",
    subgroup: "Env Files",
    tier: ToolTier.CLIENT,
    keywords: ["env", "environment", "parse", "dotenv", "config"],
    examples: [
      {
        title: "Parse .env file",
        description: "Extract environment variables into structured JSON",
        input: '# Database\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME="myapp"',
        output:
          '{\n  "variables": {\n    "DB_HOST": "localhost",\n    "DB_PORT": "5432",\n    "DB_NAME": "myapp"\n  },\n  "count": 3,\n  "comments": 1,\n  "keys": [\n    "DB_HOST",\n    "DB_PORT",\n    "DB_NAME"\n  ]\n}',
      },
    ],
    ui: { outputLanguage: "json" },
  },
  inputSchema,
  outputSchema,
  execute,
});
