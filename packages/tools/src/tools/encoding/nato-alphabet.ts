import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to NATO phonetic alphabet"),
});
const outputSchema = z.object({
  output: z.string().describe("NATO phonetic alphabet representation"),
});

const NATO: Record<string, string> = {
  A: "Alpha",
  B: "Bravo",
  C: "Charlie",
  D: "Delta",
  E: "Echo",
  F: "Foxtrot",
  G: "Golf",
  H: "Hotel",
  I: "India",
  J: "Juliet",
  K: "Kilo",
  L: "Lima",
  M: "Mike",
  N: "November",
  O: "Oscar",
  P: "Papa",
  Q: "Quebec",
  R: "Romeo",
  S: "Sierra",
  T: "Tango",
  U: "Uniform",
  V: "Victor",
  W: "Whiskey",
  X: "X-ray",
  Y: "Yankee",
  Z: "Zulu",
  "0": "Zero",
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Niner",
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const result = [...input.input.toUpperCase()]
    .map((ch) => {
      if (ch === " ") return "(space)";
      return NATO[ch] ?? ch;
    })
    .join(" ");
  return { output: result };
}

export const natoAlphabet = defineTool({
  meta: {
    id: "encoding/nato-alphabet",
    name: "NATO Alphabet",
    description:
      "Free online NATO phonetic alphabet converter — spell out text using the NATO/ICAO phonetic alphabet instantly in your browser. No data is stored. Converts letters A-Z and digits 0-9 to their standard phonetic equivalents.",
    category: "encoding",
    subgroup: "Character Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["nato", "phonetic", "alphabet", "military", "spell"],
    examples: [
      {
        title: "Spell Out Word",
        description: "Convert 'SOS' to NATO phonetic alphabet",
        input: "SOS",
        output: "Sierra Oscar Sierra",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
