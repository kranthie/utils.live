import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON-LD content to format"),
});

const outputSchema = z.object({
  output: z.string().describe("Formatted JSON-LD"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let rawInput = input.input.trim();

  // Extract JSON from script tags if present
  const scriptMatch = rawInput.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (scriptMatch) {
    rawInput = scriptMatch[1]!.trim();
  }

  let jsonLd: unknown;
  try {
    jsonLd = JSON.parse(rawInput);
  } catch {
    throw new Error("Invalid JSON: Could not parse the input as JSON-LD");
  }

  const formatted = JSON.stringify(jsonLd, null, 2);
  return { output: formatted };
}

export const jsonLdEditor = defineTool({
  meta: {
    id: "feeds/json-ld-editor",
    name: "JSON-LD Editor",
    description:
      "Free online JSON-LD formatter — paste minified JSON-LD and get pretty-printed structured data instantly in your browser. No data is stored. Extracts JSON from script tags, validates JSON syntax, and formats with consistent indentation.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "json-ld",
      "linked",
      "data",
      "format",
      "edit",
      "structured",
      "prettify",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Format minified Person JSON-LD",
        description:
          "Pretty-print a minified Schema.org Person document with indentation",
        input:
          '{"@context":"https://schema.org","@type":"Person","name":"Jane Doe","url":"https://janedoe.example.com"}',
        output:
          '{"output":"{\\n  \\"@context\\": \\"https://schema.org\\",\\n  \\"@type\\": \\"Person\\",\\n  \\"name\\": \\"Jane Doe\\",\\n  \\"url\\": \\"https://janedoe.example.com\\"\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
