import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to flip upside down"),
});
const outputSchema = z.object({ output: z.string().describe("Flipped text") });

const FLIP_MAP: Record<string, string> = {
  a: "\u0250",
  b: "q",
  c: "\u0254",
  d: "p",
  e: "\u01DD",
  f: "\u025F",
  g: "\u0183",
  h: "\u0265",
  i: "\u0131",
  j: "\u027E",
  k: "\u029E",
  l: "l",
  m: "\u026F",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "\u0279",
  s: "s",
  t: "\u0287",
  u: "n",
  v: "\u028C",
  w: "\u028D",
  x: "x",
  y: "\u028E",
  z: "z",
  A: "\u2200",
  B: "\u10412",
  C: "\u2183",
  D: "\u15E1",
  E: "\u018E",
  F: "\u2132",
  G: "\u2141",
  H: "H",
  I: "I",
  J: "\u017F",
  K: "\u22CA",
  L: "\u2142",
  M: "W",
  N: "N",
  O: "O",
  P: "\u0500",
  Q: "\u038C",
  R: "\u1D1A",
  S: "S",
  T: "\u22A5",
  U: "\u2229",
  V: "\u039B",
  W: "M",
  X: "X",
  Y: "\u2144",
  Z: "Z",
  "0": "0",
  "1": "\u0196",
  "2": "\u1105",
  "3": "\u0190",
  "4": "\u152D",
  "5": "\u03DB",
  "6": "9",
  "7": "\u2C62",
  "8": "8",
  "9": "6",
  ".": "\u02D9",
  ",": "'",
  "'": ",",
  '"': "\u201E",
  "`": ",",
  "?": "\u00BF",
  "!": "\u00A1",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
  "&": "\u214B",
  _: "\u203E",
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const flipped = [...input.input]
    .reverse()
    .map((ch) => FLIP_MAP[ch] ?? ch)
    .join("");
  return { output: flipped };
}

export const upsideDownText = defineTool({
  meta: {
    id: "misc/upside-down-text",
    name: "Upside Down Text",
    description:
      "Free online upside down text generator — flip text upside down using Unicode characters instantly in your browser. No data is stored. Reverses character order and maps each letter to its rotated equivalent.",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "upside",
      "down",
      "flip",
      "text",
      "unicode",
      "fun",
      "rotate",
      "invert",
    ],
    examples: [
      {
        title: "Flip a word upside down",
        description:
          "Each character is replaced with its rotated Unicode equivalent and the string is reversed",
        input: "Hello",
        output: "oll\u01DDH",
      },
      {
        title: "Flip a greeting upside down",
        description:
          "Multi-word text is fully reversed and each letter gets its rotated counterpart",
        input: "Good Morning",
        output: "\u0183u\u0131u\u0279oW poo\u2141",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
