import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text that may contain a Byte Order Mark (BOM)"),
});

const outputSchema = z.object({
  output: z.string().describe("Text with BOM removed"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  let result = input.input;
  let bomFound = false;

  // UTF-8 BOM: EF BB BF (appears as U+FEFF in decoded text)
  // UTF-16 BE BOM: FE FF (appears as U+FEFF)
  // UTF-16 LE BOM: FF FE (appears as U+FFFE)
  if (result.charCodeAt(0) === 0xfeff) {
    result = result.substring(1);
    bomFound = true;
  } else if (result.charCodeAt(0) === 0xfffe) {
    result = result.substring(1);
    bomFound = true;
  }

  // Also remove any BOM characters in the middle of text (rare but possible)
  const originalLength = result.length;
  result = result.replace(/\uFEFF/g, "").replace(/\uFFFE/g, "");

  const removedCount = originalLength - result.length + (bomFound ? 1 : 0);

  if (removedCount === 0) {
    return { output: result };
  }

  return { output: result };
}

export const bomRemover = defineTool({
  meta: {
    id: "encoding/bom-remover",
    name: "BOM Remover",
    description:
      "Free online BOM remover — strip Byte Order Mark characters from text instantly in your browser. No data is stored. Detects and removes UTF-8, UTF-16 BE, and UTF-16 LE BOMs from the start and middle of text.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["bom", "byte-order-mark", "remove", "utf8", "utf16"],
    examples: [
      {
        title: "Remove UTF-8 BOM",
        description: "Strip the invisible BOM character from the start of text",
        input: "\uFEFFHello, World!",
        output: "Hello, World!",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
