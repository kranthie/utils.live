import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to obfuscate"),
});
const outputSchema = z.object({
  output: z.string().describe("Obfuscated text"),
});

const CHAR_MAP: Record<string, string> = {
  a: "\u0430",
  b: "\u0432",
  c: "\u0441",
  d: "\u0501",
  e: "\u0435",
  h: "\u04BB",
  i: "\u0456",
  j: "\u0458",
  k: "\u043A",
  l: "\u04CF",
  m: "\u043C",
  o: "\u043E",
  p: "\u0440",
  s: "\u0455",
  t: "\u04AD",
  u: "\u057D",
  v: "\u0475",
  w: "\u051D",
  x: "\u0445",
  y: "\u0443",
  A: "\u0410",
  B: "\u0412",
  C: "\u0421",
  E: "\u0415",
  H: "\u041D",
  I: "\u0406",
  J: "\u0408",
  K: "\u041A",
  M: "\u041C",
  O: "\u041E",
  P: "\u0420",
  S: "\u0405",
  T: "\u0422",
  X: "\u0425",
  Y: "\u0423",
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const result = [...input.input].map((ch) => CHAR_MAP[ch] ?? ch).join("");
  return { output: result };
}

export const stringObfuscator = defineTool({
  meta: {
    id: "misc/string-obfuscator",
    name: "String Obfuscator",
    description:
      "Free online string obfuscator — replace Latin characters with visually identical Unicode homoglyphs instantly in your browser. No data is stored. Uses Cyrillic and other lookalike characters to create text that looks the same but has different code points.",
    category: "misc",
    subgroup: "String Utilities",
    tier: ToolTier.CLIENT,
    keywords: [
      "obfuscate",
      "unicode",
      "homoglyph",
      "lookalike",
      "confusable",
      "cyrillic",
      "idn",
    ],
    examples: [
      {
        title: "Obfuscate a greeting with homoglyphs",
        description:
          "Each Latin letter is replaced with a visually identical Cyrillic or other Unicode character",
        input: "hello",
        output: "\u04BB\u0435\u04CF\u04CF\u043E",
      },
      {
        title: "Obfuscate a domain name",
        description:
          "Demonstrates an IDN homograph-style transformation — the text looks identical but differs at the code-point level",
        input: "example.com",
        output: "\u0435\u0445\u0430\u043C\u0440\u04CF\u0435.\u0441\u043E\u043C",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
