import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to leet speak"),
});
const outputSchema = z.object({
  output: z.string().describe("1337 speak text"),
});

const LEET: Record<string, string> = {
  a: "4",
  b: "8",
  e: "3",
  g: "9",
  i: "1",
  l: "1",
  o: "0",
  s: "5",
  t: "7",
  z: "2",
  A: "4",
  B: "8",
  E: "3",
  G: "9",
  I: "1",
  L: "1",
  O: "0",
  S: "5",
  T: "7",
  Z: "2",
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  return { output: [...input.input].map((ch) => LEET[ch] ?? ch).join("") };
}

export const leetSpeak = defineTool({
  meta: {
    id: "misc/leet-speak",
    name: "Leet Speak",
    description:
      "Free online leet speak converter — transform plain text to 1337 speak instantly in your browser. No data is stored. Replaces letters with common substitutions (a→4, e→3, o→0, s→5, t→7, and more).",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "leet",
      "1337",
      "speak",
      "hacker",
      "fun",
      "substitution",
      "internet",
      "slang",
    ],
    examples: [
      {
        title: "Classic greeting in leet speak",
        description:
          "Convert 'Hello World' showing common letter substitutions",
        input: "Hello World",
        output: "H3110 W0r1d",
      },
      {
        title: "Hacker slang conversion",
        description: "Every letter in 'elite hacker' has a leet substitution",
        input: "elite hacker",
        output: "31173 h4ck3r",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
