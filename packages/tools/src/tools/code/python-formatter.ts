import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { formatPython } from "./_format-utils";

const inputSchema = z.object({
  input: z.string().describe("Python code to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted Python code"),
});

const optionsSchema = z.object({
  indent: z
    .number()
    .int()
    .min(1)
    .max(8)
    .default(4)
    .describe("Spaces per indent level"),
});

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  return { output: formatPython(input.input, options?.indent ?? 4) };
}

export const pythonFormatter = defineTool({
  meta: {
    id: "code/python-formatter",
    name: "Python Formatter",
    description:
      "Free online Python formatter — format Python code with consistent indentation instantly in your browser. No data is stored. Basic formatter with configurable indent size for def, class, if, for, while, and try blocks.",
    category: "code",
    subgroup: "Formatters",
    tier: ToolTier.CLIENT,
    keywords: ["python", "format", "indent", "prettify"],
    examples: [
      {
        title: "Format Python code",
        description: "Fix indentation in a Python function",
        input:
          "def greet(name):\n  if name:\n    print(f'Hello {name}')\n  else:\n    print('Hello World')",
        output:
          "def greet(name):\n    if name:\n    print(f'Hello {name}')\n    else:\n    print('Hello World')",
      },
    ],
    ui: { inputLanguage: "python", outputLanguage: "python" },
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
