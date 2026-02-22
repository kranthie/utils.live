import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  pattern: z
    .enum([
      "word-number-word",
      "word-symbol-word-number",
      "adjective-noun-number",
      "custom",
    ])
    .default("word-number-word")
    .describe("Password pattern"),
  count: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe("Number of passwords to generate"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated memorable password(s)"),
});

const ADJECTIVES = [
  "happy",
  "brave",
  "quick",
  "bright",
  "calm",
  "clever",
  "eager",
  "fierce",
  "gentle",
  "jolly",
  "kind",
  "lively",
  "merry",
  "noble",
  "proud",
  "sharp",
  "swift",
  "vivid",
  "warm",
  "bold",
  "cosmic",
  "daring",
  "epic",
  "fresh",
  "grand",
  "icy",
  "jade",
  "keen",
  "lucky",
  "neat",
  "rapid",
  "silent",
  "tiny",
  "ultra",
  "vast",
  "wild",
  "zen",
  "agile",
  "crisp",
  "deep",
];

const NOUNS = [
  "tiger",
  "eagle",
  "river",
  "mountain",
  "forest",
  "ocean",
  "thunder",
  "crystal",
  "dragon",
  "falcon",
  "garden",
  "harbor",
  "island",
  "jaguar",
  "kingdom",
  "lantern",
  "meteor",
  "nebula",
  "orchid",
  "phoenix",
  "quartz",
  "rocket",
  "shadow",
  "temple",
  "unicorn",
  "vortex",
  "whisper",
  "zenith",
  "anchor",
  "beacon",
  "comet",
  "delta",
  "ember",
  "flame",
  "glacier",
  "horizon",
  "nova",
  "oasis",
  "pearl",
  "storm",
];

const SYMBOLS = ["!", "@", "#", "$", "%", "&", "*", "+", "=", "?"];

function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  // Rejection sampling to eliminate modulo bias
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(array);
  } while (array[0]! >= limit);
  return array[0]! % max;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[secureRandomInt(arr.length)] as T;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const memorablePassword = defineTool({
  meta: {
    id: "crypto/memorable-password",
    name: "Memorable Password Generator",
    description:
      "Free online memorable password generator — generate easy-to-remember passwords instantly in your browser. No data is stored. Combines words, numbers, and symbols in patterns like word-number-word and adjective-noun-number.",
    category: "crypto",
    subgroup: "Password Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "password",
      "memorable",
      "generate",
      "easy",
      "remember",
      "words",
    ],
    icon: "KeyRound",
    examples: [
      {
        title: "Word-Number-Word",
        description:
          "Generate a memorable password combining two words and a number",
        input: { pattern: "word-number-word", count: 1 },
        output:
          "(Memorable password, e.g., Tiger428Phoenix — output varies due to random word selection)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute: (input) => {
    const passwords: string[] = [];

    for (let n = 0; n < input.count; n++) {
      let password: string;

      switch (input.pattern) {
        case "word-number-word":
          password =
            capitalize(pickRandom(NOUNS)) +
            secureRandomInt(1000).toString() +
            capitalize(pickRandom(NOUNS));
          break;

        case "word-symbol-word-number":
          password =
            capitalize(pickRandom(NOUNS)) +
            pickRandom(SYMBOLS) +
            capitalize(pickRandom(NOUNS)) +
            secureRandomInt(100).toString();
          break;

        case "adjective-noun-number":
          password =
            capitalize(pickRandom(ADJECTIVES)) +
            capitalize(pickRandom(NOUNS)) +
            secureRandomInt(1000).toString();
          break;

        case "custom":
        default:
          password =
            capitalize(pickRandom(ADJECTIVES)) +
            pickRandom(SYMBOLS) +
            capitalize(pickRandom(NOUNS)) +
            secureRandomInt(100).toString() +
            pickRandom(SYMBOLS);
          break;
      }

      passwords.push(password);
    }

    return { output: passwords.join("\n") };
  },
});
