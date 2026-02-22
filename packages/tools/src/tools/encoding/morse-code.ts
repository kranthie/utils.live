import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert to/from Morse code"),
});
const optionsSchema = z.object({
  direction: z
    .enum(["to-morse", "from-morse"])
    .default("to-morse")
    .describe("Conversion direction"),
});
const outputSchema = z.object({
  output: z.string().describe("Converted text"),
});

const TO_MORSE: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "'": ".----.",
  "!": "-.-.--",
  "/": "-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  _: "..--.-",
  '"': ".-..-.",
  $: "...-..-",
  "@": ".--.-.",
  " ": "/",
};

const FROM_MORSE: Record<string, string> = {};
for (const [k, v] of Object.entries(TO_MORSE)) FROM_MORSE[v] = k;

function execute(
  input: z.infer<typeof inputSchema>,
  options?: z.infer<typeof optionsSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const dir = options?.direction ?? "to-morse";
  if (dir === "to-morse") {
    const result = [...input.input.toUpperCase()]
      .map((ch) => TO_MORSE[ch] ?? ch)
      .join(" ");
    return { output: result };
  } else {
    const words = input.input.trim().split(/\s{3,}|\s*\/\s*/);
    const result = words
      .map((word) =>
        word
          .split(/\s+/)
          .map((code) => FROM_MORSE[code] ?? "?")
          .join("")
      )
      .join(" ");
    return { output: result };
  }
}

export const morseCode = defineTool({
  meta: {
    id: "encoding/morse-code",
    name: "Morse Code",
    description:
      "Free online Morse code converter — convert text to Morse code dots and dashes instantly in your browser. No data is stored. Supports all letters A-Z, digits 0-9, and common punctuation marks.",
    category: "encoding",
    subgroup: "Character Encoding",
    tier: ToolTier.CLIENT,
    keywords: ["morse", "code", "convert", "dots", "dashes", "telegraph"],
    examples: [
      {
        title: "Text to Morse",
        description: "Convert 'SOS' to Morse code",
        input: "SOS",
        output: "... --- ...",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
