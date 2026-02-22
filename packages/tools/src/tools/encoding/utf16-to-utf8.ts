import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text to show UTF-16 code units and UTF-8 bytes"),
});

const outputSchema = z.object({
  output: z
    .string()
    .describe("UTF-16 code units and UTF-8 byte representation"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  try {
    if (!input.input) {
      return { output: "(empty string)" };
    }

    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(input.input);

    const lines: string[] = [];
    lines.push("=== UTF-16 Code Units ===");
    lines.push(`Code unit count: ${input.input.length}`);
    const units: string[] = [];
    for (let i = 0; i < input.input.length; i++) {
      units.push(
        input.input.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase()
      );
    }
    lines.push(`Code units (hex): ${units.join(" ")}`);

    lines.push("");
    lines.push("=== UTF-8 Bytes ===");
    lines.push(`Byte count: ${utf8Bytes.length}`);
    lines.push(
      `Bytes (hex): ${Array.from(utf8Bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ")}`
    );

    lines.push("");
    lines.push(`=== Size Comparison ===`);
    lines.push(
      `UTF-16 size: ${input.input.length * 2} bytes (${input.input.length} code units x 2)`
    );
    lines.push(`UTF-8 size: ${utf8Bytes.length} bytes`);

    const ratio = ((utf8Bytes.length / (input.input.length * 2)) * 100).toFixed(
      1
    );
    lines.push(`UTF-8 is ${ratio}% of UTF-16 size`);

    return { output: lines.join("\n") };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to convert";
    throw createToolError({
      code: EXEC_FAILED,
      message: `UTF-16 to UTF-8 conversion failed: ${msg}`,
    });
  }
}

export const utf16ToUtf8 = defineTool({
  meta: {
    id: "encoding/utf16-to-utf8",
    name: "UTF-16 to UTF-8",
    description:
      "Free online UTF-16 to UTF-8 converter — compare UTF-16 code units and UTF-8 bytes for any text instantly in your browser. No data is stored. Shows hex values, byte counts, and size comparison between UTF-16 and UTF-8 encodings.",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["utf16", "utf8", "encoding", "bytes", "code-units"],
    examples: [
      {
        title: "Compare Encodings",
        description: "Show UTF-16 and UTF-8 representations of text",
        input: "Hello",
        output:
          "=== UTF-16 Code Units ===\nCode unit count: 5\nCode units (hex): 0048 0065 006C 006C 006F\n\n=== UTF-8 Bytes ===\nByte count: 5\nBytes (hex): 48 65 6C 6C 6F\n\n=== Size Comparison ===\nUTF-16 size: 10 bytes (5 code units x 2)\nUTF-8 size: 5 bytes\nUTF-8 is 50.0% of UTF-16 size",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
