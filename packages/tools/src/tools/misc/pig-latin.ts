import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to Pig Latin"),
});
const outputSchema = z.object({
  output: z.string().describe("Pig Latin text"),
});

function toPigLatin(word: string): string {
  if (!word) return word;
  const vowels = "aeiouAEIOU";
  if (vowels.includes(word[0]!)) return word + "yay";
  let consonantCluster = "";
  let rest = word;
  for (let i = 0; i < word.length; i++) {
    if (vowels.includes(word[i]!)) {
      rest = word.substring(i);
      break;
    }
    consonantCluster += word[i];
    if (i === word.length - 1) rest = "";
  }
  const result = rest + consonantCluster + "ay";
  if (word[0]! === word[0]!.toUpperCase()) {
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  }
  return result;
}

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const result = input.input.replace(/\b([a-zA-Z]+)\b/g, (match) =>
    toPigLatin(match)
  );
  return { output: result };
}

export const pigLatin = defineTool({
  meta: {
    id: "misc/pig-latin",
    name: "Pig Latin",
    description:
      "Free online Pig Latin translator — convert English text to Pig Latin instantly in your browser. No data is stored. Handles consonant clusters, preserves capitalization, and appends 'yay' to vowel-starting words.",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: ["pig", "latin", "fun", "language", "game", "translator", "word"],
    examples: [
      {
        title: "Translate a greeting to Pig Latin",
        description:
          "Consonant-starting words move the cluster to the end and add 'ay'",
        input: "Hello World",
        output: "Ellohay Orldway",
      },
      {
        title: "Vowel-starting words get 'yay' suffix",
        description: "Words starting with vowels simply get 'yay' appended",
        input: "I eat apples every day",
        output: "Iyay eatyay applesyay everyyay ayday",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
