import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z.string().optional().describe("Search emoji by name or keyword"),
  category: z
    .enum([
      "all",
      "smileys",
      "people",
      "animals",
      "food",
      "travel",
      "objects",
      "symbols",
    ])
    .default("all")
    .describe("Emoji category"),
});
const outputSchema = z.object({
  output: z.string().describe("Emoji reference list"),
});

const EMOJIS: Array<[string, string, string]> = [
  ["\u{1F600}", "grinning face", "smileys"],
  ["\u{1F601}", "beaming face", "smileys"],
  ["\u{1F602}", "face with tears of joy", "smileys"],
  ["\u{1F603}", "grinning face with big eyes", "smileys"],
  ["\u{1F604}", "grinning squinting face", "smileys"],
  ["\u{1F605}", "grinning face with sweat", "smileys"],
  ["\u{1F606}", "squinting face", "smileys"],
  ["\u{1F609}", "winking face", "smileys"],
  ["\u{1F60A}", "smiling face with smiling eyes", "smileys"],
  ["\u{1F60D}", "heart eyes", "smileys"],
  ["\u{1F60E}", "smiling face with sunglasses", "smileys"],
  ["\u{1F60F}", "smirking face", "smileys"],
  ["\u{1F612}", "unamused face", "smileys"],
  ["\u{1F614}", "pensive face", "smileys"],
  ["\u{1F618}", "face blowing a kiss", "smileys"],
  ["\u{1F620}", "angry face", "smileys"],
  ["\u{1F622}", "crying face", "smileys"],
  ["\u{1F62D}", "loudly crying", "smileys"],
  ["\u{1F631}", "face screaming", "smileys"],
  ["\u{1F634}", "sleeping face", "smileys"],
  ["\u{1F914}", "thinking face", "smileys"],
  ["\u{1F44D}", "thumbs up", "people"],
  ["\u{1F44E}", "thumbs down", "people"],
  ["\u{1F44F}", "clapping hands", "people"],
  ["\u{1F44B}", "waving hand", "people"],
  ["\u{270C}\u{FE0F}", "victory hand", "people"],
  ["\u{1F4AA}", "flexed biceps", "people"],
  ["\u{1F436}", "dog face", "animals"],
  ["\u{1F431}", "cat face", "animals"],
  ["\u{1F42D}", "mouse face", "animals"],
  ["\u{1F43B}", "bear", "animals"],
  ["\u{1F427}", "penguin", "animals"],
  ["\u{1F426}", "bird", "animals"],
  ["\u{1F98B}", "butterfly", "animals"],
  ["\u{1F40D}", "snake", "animals"],
  ["\u{1F422}", "turtle", "animals"],
  ["\u{1F34E}", "red apple", "food"],
  ["\u{1F34F}", "green apple", "food"],
  ["\u{1F355}", "pizza", "food"],
  ["\u{1F354}", "hamburger", "food"],
  ["\u{1F382}", "birthday cake", "food"],
  ["\u{2615}", "hot beverage", "food"],
  ["\u{1F37A}", "beer mug", "food"],
  ["\u{1F377}", "wine glass", "food"],
  ["\u{1F697}", "car", "travel"],
  ["\u{2708}\u{FE0F}", "airplane", "travel"],
  ["\u{1F680}", "rocket", "travel"],
  ["\u{1F3E0}", "house", "travel"],
  ["\u{1F30D}", "globe", "travel"],
  ["\u{1F4F1}", "mobile phone", "objects"],
  ["\u{1F4BB}", "laptop", "objects"],
  ["\u{1F4A1}", "light bulb", "objects"],
  ["\u{1F511}", "key", "objects"],
  ["\u{1F512}", "lock", "objects"],
  ["\u{1F4E7}", "email", "objects"],
  ["\u{2764}\u{FE0F}", "red heart", "symbols"],
  ["\u{2B50}", "star", "symbols"],
  ["\u{2705}", "check mark", "symbols"],
  ["\u{274C}", "cross mark", "symbols"],
  ["\u{26A0}\u{FE0F}", "warning", "symbols"],
  ["\u{1F525}", "fire", "symbols"],
  ["\u{2728}", "sparkles", "symbols"],
  ["\u{1F389}", "party popper", "symbols"],
  ["\u{1F4AF}", "hundred points", "symbols"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = EMOJIS;
  if (input.category && input.category !== "all") {
    filtered = filtered.filter(([, , cat]) => cat === input.category);
  }
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(([, name]) => name.toLowerCase().includes(q));
  }
  const lines = filtered.map(([emoji, name]) => `${emoji}  ${name}`);
  return { output: lines.join("\n") || "No matching emoji found." };
}

export const emojiReference = defineTool({
  meta: {
    id: "reference/emoji-reference",
    name: "Emoji Reference",
    description:
      "Free online emoji reference — search and browse 60+ common emojis by name or category instantly in your browser. No data is stored. Filter by smileys, people, animals, food, travel, objects, and symbols.",
    category: "reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "emoji",
      "reference",
      "search",
      "list",
      "unicode",
      "emoticon",
      "symbol",
      "lookup",
      "copy",
    ],
    examples: [
      {
        title: "Search heart emojis",
        description:
          "Find all emojis with 'heart' in their name across all categories",
        input: { filter: "heart" },
        output: "\u{1F60D}  heart eyes\n\u2764\uFE0F  red heart",
      },
      {
        title: "Browse animal emojis",
        description: "List all emojis in the animals category",
        input: { category: "animals" },
        output:
          "\u{1F436}  dog face\n\u{1F431}  cat face\n\u{1F42D}  mouse face\n\u{1F43B}  bear\n\u{1F427}  penguin\n\u{1F426}  bird\n\u{1F98B}  butterfly\n\u{1F40D}  snake\n\u{1F422}  turtle",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
