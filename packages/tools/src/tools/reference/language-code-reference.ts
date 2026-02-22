import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  filter: z.string().optional().describe("Search by language code or name"),
});
const outputSchema = z.object({
  output: z.string().describe("Language codes reference"),
});

const LANGUAGES: Array<[string, string, string]> = [
  ["en", "eng", "English"],
  ["es", "spa", "Spanish"],
  ["fr", "fra", "French"],
  ["de", "deu", "German"],
  ["it", "ita", "Italian"],
  ["pt", "por", "Portuguese"],
  ["ru", "rus", "Russian"],
  ["zh", "zho", "Chinese"],
  ["ja", "jpn", "Japanese"],
  ["ko", "kor", "Korean"],
  ["ar", "ara", "Arabic"],
  ["hi", "hin", "Hindi"],
  ["bn", "ben", "Bengali"],
  ["pa", "pan", "Punjabi"],
  ["ur", "urd", "Urdu"],
  ["vi", "vie", "Vietnamese"],
  ["th", "tha", "Thai"],
  ["id", "ind", "Indonesian"],
  ["ms", "msa", "Malay"],
  ["tl", "tgl", "Tagalog"],
  ["nl", "nld", "Dutch"],
  ["pl", "pol", "Polish"],
  ["uk", "ukr", "Ukrainian"],
  ["cs", "ces", "Czech"],
  ["sv", "swe", "Swedish"],
  ["no", "nor", "Norwegian"],
  ["da", "dan", "Danish"],
  ["fi", "fin", "Finnish"],
  ["el", "ell", "Greek"],
  ["tr", "tur", "Turkish"],
  ["he", "heb", "Hebrew"],
  ["ro", "ron", "Romanian"],
  ["hu", "hun", "Hungarian"],
  ["bg", "bul", "Bulgarian"],
  ["hr", "hrv", "Croatian"],
  ["sk", "slk", "Slovak"],
  ["sl", "slv", "Slovenian"],
  ["lt", "lit", "Lithuanian"],
  ["lv", "lav", "Latvian"],
  ["et", "est", "Estonian"],
  ["fa", "fas", "Persian"],
  ["sw", "swa", "Swahili"],
  ["am", "amh", "Amharic"],
  ["ta", "tam", "Tamil"],
  ["te", "tel", "Telugu"],
  ["mr", "mar", "Marathi"],
  ["gu", "guj", "Gujarati"],
  ["kn", "kan", "Kannada"],
  ["ml", "mal", "Malayalam"],
  ["af", "afr", "Afrikaans"],
  ["ca", "cat", "Catalan"],
  ["gl", "glg", "Galician"],
  ["eu", "eus", "Basque"],
  ["cy", "cym", "Welsh"],
  ["ga", "gle", "Irish"],
  ["la", "lat", "Latin"],
];

function execute(
  input: z.infer<typeof inputSchema>
): z.infer<typeof outputSchema> {
  let filtered = LANGUAGES;
  if (input.filter) {
    const q = input.filter.toLowerCase();
    filtered = filtered.filter(
      ([a2, a3, name]) =>
        a2.includes(q) || a3.includes(q) || name.toLowerCase().includes(q)
    );
  }
  const header = `${"ISO1".padEnd(6)}${"ISO2".padEnd(6)}Language`;
  const lines = filtered.map(
    ([a2, a3, name]) => `${a2.padEnd(6)}${a3.padEnd(6)}${name}`
  );
  return { output: [header, "-".repeat(30), ...lines].join("\n") };
}

export const languageCodeReference = defineTool({
  meta: {
    id: "reference/language-code-reference",
    name: "Language Code Reference",
    description:
      "Free online language code reference — look up ISO 639-1 and ISO 639-2 codes for 55+ languages instantly in your browser. No data is stored. Search by language name or code — covers major world languages, European, Asian, and African languages.",
    category: "reference",
    tier: ToolTier.CLIENT,
    keywords: [
      "language",
      "code",
      "iso",
      "iso-639",
      "locale",
      "reference",
      "lookup",
      "i18n",
      "internationalization",
      "translation",
    ],
    examples: [
      {
        title: "Find Spanish language codes",
        description: "Look up ISO 639-1 and ISO 639-2 codes for Spanish",
        input: { filter: "spanish" },
        output:
          "ISO1  ISO2  Language\n------------------------------\nes    spa   Spanish",
      },
      {
        title: "Search by ISO 639-2 code",
        description: "Look up which language has the ISO 639-2 code 'jpn'",
        input: { filter: "jpn" },
        output:
          "ISO1  ISO2  Language\n------------------------------\nja    jpn   Japanese",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
