import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";
import { createToolError } from "../../core/errors";
import { EXEC_FAILED } from "../../core/error-codes";

const inputSchema = z.object({
  input: z.string().describe("Text or byte values to convert"),
});

const outputSchema = z.object({
  output: z.string().describe("Conversion result"),
});

const optionsSchema = z.object({
  mode: z
    .enum(["to-bytes", "from-bytes"])
    .default("to-bytes")
    .describe("Convert text to Latin-1 byte values, or byte values to text"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

function execute(input: Input, options?: Options): Output {
  const mode = options?.mode ?? "to-bytes";

  try {
    if (mode === "to-bytes") {
      const lines: string[] = [];
      const byteValues: number[] = [];
      let hasOutOfRange = false;

      for (let i = 0; i < input.input.length; i++) {
        const cp = input.input.codePointAt(i)!;
        if (cp > 0xffff) i++; // Skip surrogate

        if (cp > 255) {
          hasOutOfRange = true;
          lines.push(
            `'${String.fromCodePoint(cp)}' (U+${cp.toString(16).padStart(4, "0").toUpperCase()}) - NOT in Latin-1`
          );
        } else {
          byteValues.push(cp);
          const char =
            cp >= 0x20 && cp !== 0x7f
              ? String.fromCharCode(cp)
              : `(0x${cp.toString(16).padStart(2, "0")})`;
          lines.push(
            `'${char}' -> 0x${cp.toString(16).padStart(2, "0").toUpperCase()} (${cp})`
          );
        }
      }

      if (hasOutOfRange) {
        lines.unshift(
          "WARNING: Some characters are outside the Latin-1 (ISO-8859-1) range (0-255)\n"
        );
      }

      lines.push("");
      lines.push(
        `Latin-1 bytes (hex): ${byteValues.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ")}`
      );
      lines.push(`Latin-1 bytes (dec): ${byteValues.join(" ")}`);

      return { output: lines.join("\n") };
    } else {
      // from-bytes: parse space/comma-separated byte values
      const parts = input.input
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean);

      const chars: string[] = [];
      for (const part of parts) {
        let val: number;
        if (part.startsWith("0x") || part.startsWith("0X")) {
          val = parseInt(part, 16);
        } else {
          val = parseInt(part, 10);
        }
        if (isNaN(val) || val < 0 || val > 255) {
          throw new Error(
            `Invalid Latin-1 byte value: '${part}' (must be 0-255)`
          );
        }
        chars.push(String.fromCharCode(val));
      }

      return { output: chars.join("") };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Conversion failed";
    throw createToolError({
      code: EXEC_FAILED,
      message: `Latin-1 conversion failed: ${msg}`,
    });
  }
}

export const latin1Converter = defineTool({
  meta: {
    id: "encoding/latin1-converter",
    name: "Latin-1 Converter",
    description:
      "Free online Latin-1 converter — convert text to ISO-8859-1 byte values or byte values back to text instantly in your browser. No data is stored. Shows hex and decimal byte values, and flags characters outside the Latin-1 range (0-255).",
    category: "encoding",
    subgroup: "Character Sets",
    tier: ToolTier.CLIENT,
    keywords: ["latin1", "iso-8859-1", "encoding", "charset", "convert"],
    examples: [
      {
        title: "Text to Latin-1 Bytes",
        description: "Convert text characters to their Latin-1 byte values",
        input: "ABC",
        output:
          "'A' -> 0x41 (65)\n'B' -> 0x42 (66)\n'C' -> 0x43 (67)\n\nLatin-1 bytes (hex): 41 42 43\nLatin-1 bytes (dec): 65 66 67",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
