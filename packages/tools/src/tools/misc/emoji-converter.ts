import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert words to emoji"),
});
const outputSchema = z.object({
  output: z.string().describe("Text with emoji replacements"),
});

const EMOJI_MAP: Record<string, string> = {
  happy: "\u{1F60A}",
  sad: "\u{1F622}",
  love: "\u{2764}\u{FE0F}",
  heart: "\u{2764}\u{FE0F}",
  fire: "\u{1F525}",
  star: "\u{2B50}",
  sun: "\u{2600}\u{FE0F}",
  moon: "\u{1F319}",
  rain: "\u{1F327}\u{FE0F}",
  snow: "\u{2744}\u{FE0F}",
  cloud: "\u{2601}\u{FE0F}",
  dog: "\u{1F436}",
  cat: "\u{1F431}",
  fish: "\u{1F41F}",
  bird: "\u{1F426}",
  tree: "\u{1F333}",
  flower: "\u{1F33A}",
  rose: "\u{1F339}",
  leaf: "\u{1F343}",
  car: "\u{1F697}",
  plane: "\u{2708}\u{FE0F}",
  rocket: "\u{1F680}",
  house: "\u{1F3E0}",
  phone: "\u{1F4F1}",
  computer: "\u{1F4BB}",
  email: "\u{1F4E7}",
  book: "\u{1F4D6}",
  music: "\u{1F3B5}",
  camera: "\u{1F4F7}",
  movie: "\u{1F3AC}",
  coffee: "\u{2615}",
  pizza: "\u{1F355}",
  cake: "\u{1F382}",
  beer: "\u{1F37A}",
  wine: "\u{1F377}",
  thumbsup: "\u{1F44D}",
  thumbsdown: "\u{1F44E}",
  clap: "\u{1F44F}",
  wave: "\u{1F44B}",
  ok: "\u{1F44C}",
  yes: "\u{2705}",
  no: "\u{274C}",
  warning: "\u{26A0}\u{FE0F}",
  check: "\u{2705}",
  cross: "\u{274C}",
  question: "\u{2753}",
  exclamation: "\u{2757}",
  money: "\u{1F4B0}",
  time: "\u{23F0}",
  clock: "\u{1F570}\u{FE0F}",
  calendar: "\u{1F4C5}",
  gift: "\u{1F381}",
  party: "\u{1F389}",
  balloon: "\u{1F388}",
  crown: "\u{1F451}",
  laugh: "\u{1F602}",
  cry: "\u{1F62D}",
  angry: "\u{1F620}",
  cool: "\u{1F60E}",
  think: "\u{1F914}",
  sleep: "\u{1F634}",
  sick: "\u{1F912}",
  scared: "\u{1F628}",
  earth: "\u{1F30D}",
  world: "\u{1F30D}",
  water: "\u{1F4A7}",
  key: "\u{1F511}",
  lock: "\u{1F512}",
  bug: "\u{1F41B}",
  light: "\u{1F4A1}",
  idea: "\u{1F4A1}",
};

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  if (!input.input.trim()) throw new Error("Input cannot be empty");
  const result = input.input.replace(/\b(\w+)\b/g, (match) => {
    const lower = match.toLowerCase();
    return EMOJI_MAP[lower] ? `${match} ${EMOJI_MAP[lower]}` : match;
  });
  return { output: result };
}

export const emojiConverter = defineTool({
  meta: {
    id: "misc/emoji-converter",
    name: "Emoji Converter",
    description:
      "Free online emoji converter — replace common English words with matching emoji instantly in your browser. No data is stored. Recognizes 70+ words including emotions, animals, weather, food, and objects.",
    category: "misc",
    subgroup: "Fun Tools",
    tier: ToolTier.CLIENT,
    keywords: [
      "emoji",
      "convert",
      "text",
      "emoticon",
      "fun",
      "unicode",
      "smiley",
      "replace",
    ],
    examples: [
      {
        title: "Add emoji to a casual message",
        description:
          "Inserts matching emoji next to recognized words like love, coffee, pizza, and sun",
        input: "I love coffee and pizza on a sun day",
        output:
          "I love \u2764\uFE0F coffee \u2615 and pizza \uD83C\uDF55 on a sun \u2600\uFE0F day",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
