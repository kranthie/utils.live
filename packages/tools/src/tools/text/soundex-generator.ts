import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to generate Soundex code for"),
});
const outputSchema = z.object({
  output: z.string().describe("Soundex codes"),
});

const SOUNDEX_MAP: Record<string, string> = {
  B: "1",
  F: "1",
  P: "1",
  V: "1",
  C: "2",
  G: "2",
  J: "2",
  K: "2",
  Q: "2",
  S: "2",
  X: "2",
  Z: "2",
  D: "3",
  T: "3",
  L: "4",
  M: "5",
  N: "5",
  R: "6",
};

function soundex(word: string): string {
  const upper = word.toUpperCase().replace(/[^A-Z]/g, "");
  if (!upper) return "";
  let code = upper[0]!;
  let lastCode = SOUNDEX_MAP[upper[0]!] ?? "";
  for (let i = 1; i < upper.length && code.length < 4; i++) {
    const c = SOUNDEX_MAP[upper[i]!] ?? "0";
    if (c !== "0" && c !== lastCode) {
      code += c;
    }
    lastCode = c === "0" ? lastCode : c;
  }
  return code.padEnd(4, "0");
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const words = input.input.trim().split(/\s+/);
  const results = words.map((w) => `${w}: ${soundex(w)}`);
  return { output: results.join("\n") };
}

export const soundexGenerator = defineTool({
  meta: {
    id: "text/soundex-generator",
    name: "Soundex Generator",
    description:
      "Free online Soundex generator — compute Soundex phonetic codes for words instantly in your browser. No data is stored. Useful for matching similar-sounding names and phonetic search.",
    category: "text",
    subgroup: "Phonetic",
    tier: ToolTier.CLIENT,
    keywords: ["soundex", "phonetic", "code", "sound", "search"],
    examples: [
      {
        title: "Generate Soundex codes",
        description: "Create Soundex phonetic codes for similar-sounding names",
        input: "Robert Rupert",
        output: "Robert: R163\nRupert: R163",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
