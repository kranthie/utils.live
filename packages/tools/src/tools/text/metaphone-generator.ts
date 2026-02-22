import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to generate Metaphone code for"),
});
const outputSchema = z.object({
  output: z.string().describe("Metaphone codes"),
});

function metaphone(word: string): string {
  let w = word.toUpperCase().replace(/[^A-Z]/g, "");
  if (!w) return "";
  // Drop initial silent letters
  if (
    w.startsWith("AE") ||
    w.startsWith("GN") ||
    w.startsWith("KN") ||
    w.startsWith("PN") ||
    w.startsWith("WR")
  )
    w = w.substring(1);
  let code = "";
  for (let i = 0; i < w.length && code.length < 6; i++) {
    const c = w[i]!;
    const prev = i > 0 ? w[i - 1]! : "";
    const next = i < w.length - 1 ? w[i + 1]! : "";
    if (c === prev && c !== "C") continue;
    switch (c) {
      case "A":
      case "E":
      case "I":
      case "O":
      case "U":
        if (i === 0) code += c;
        break;
      case "B":
        if (prev !== "M") code += "B";
        break;
      case "C":
        if (next === "I" || next === "E" || next === "Y") code += "S";
        else code += "K";
        break;
      case "D":
        if (next === "G" && "IEY".includes(w[i + 2] ?? "")) code += "J";
        else code += "T";
        break;
      case "F":
        code += "F";
        break;
      case "G":
        if (next === "H" && !"AEIOUY".includes(w[i + 2] ?? "")) {
          i++;
          break;
        }
        if (i > 0 && (next === "N" || next === undefined)) break;
        if ("IEY".includes(next)) code += "J";
        else code += "K";
        break;
      case "H":
        if ("AEIOUY".includes(next) && !"AEIOUY".includes(prev)) code += "H";
        break;
      case "J":
        code += "J";
        break;
      case "K":
        if (prev !== "C") code += "K";
        break;
      case "L":
        code += "L";
        break;
      case "M":
        code += "M";
        break;
      case "N":
        code += "N";
        break;
      case "P":
        if (next === "H") {
          code += "F";
          i++;
        } else code += "P";
        break;
      case "Q":
        code += "K";
        break;
      case "R":
        code += "R";
        break;
      case "S":
        if (
          next === "H" ||
          (next === "I" && (w[i + 2] === "O" || w[i + 2] === "A"))
        ) {
          code += "X";
          i++;
        } else code += "S";
        break;
      case "T":
        if (next === "H") {
          code += "0";
          i++;
        } else if (next === "I" && (w[i + 2] === "O" || w[i + 2] === "A")) {
          code += "X";
        } else code += "T";
        break;
      case "V":
        code += "F";
        break;
      case "W":
      case "Y":
        if ("AEIOUY".includes(next)) code += c;
        break;
      case "X":
        code += "KS";
        break;
      case "Z":
        code += "S";
        break;
    }
  }
  return code;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const words = input.input.trim().split(/\s+/);
  return { output: words.map((w) => `${w}: ${metaphone(w)}`).join("\n") };
}

export const metaphoneGenerator = defineTool({
  meta: {
    id: "text/metaphone-generator",
    name: "Metaphone Generator",
    description:
      "Free online Metaphone generator — compute Metaphone phonetic codes for words instantly in your browser. No data is stored. Useful for fuzzy name matching and phonetic search indexing.",
    category: "text",
    subgroup: "Phonetic",
    tier: ToolTier.CLIENT,
    keywords: ["metaphone", "phonetic", "code", "sound", "search"],
    examples: [
      {
        title: "Generate phonetic codes",
        description: "Create Metaphone codes for names that sound similar",
        input: "Smith Schmidt",
        output: "Smith: SM0\nSchmidt: SKMTT",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
