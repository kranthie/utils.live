import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  count: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(5)
    .describe("Number of units"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Lorem Ipsum text"),
  wordCount: z.number().describe("Total word count"),
  characterCount: z.number().describe("Total character count"),
});

const optionsSchema = z.object({
  unit: z
    .enum(["words", "sentences", "paragraphs"])
    .default("paragraphs")
    .describe("Unit type"),
  startWithLorem: z
    .boolean()
    .default(true)
    .describe("Start with 'Lorem ipsum'"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;
type Options = z.infer<typeof optionsSchema>;

const LOREM_WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "cras",
  "justo",
  "pellentesque",
  "eu",
  "massa",
  "sociis",
  "natoque",
  "penatibus",
  "magnis",
  "dis",
  "parturient",
  "montes",
  "nascetur",
  "ridiculus",
  "mus",
  "donec",
  "quam",
  "felis",
  "ultricies",
  "nec",
  "mauris",
  "vitae",
  "proin",
  "sagittis",
  "nisl",
  "rhoncus",
  "mattis",
  "viverra",
  "faucibus",
  "pharetra",
  "semper",
  "egestas",
  "dictum",
  "posuere",
  "morbi",
  "leo",
  "urna",
  "molestie",
];

const LOREM_START = "Lorem ipsum dolor sit amet, consectetur adipiscing elit";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomWord(): string {
  const word = LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)];
  return word ?? "lorem";
}

function generateSentence(minWords: number = 5, maxWords: number = 15): string {
  const wordCount = randomInt(minWords, maxWords);
  const words: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    words.push(randomWord());
  }

  // Capitalize first word
  const firstWord = words[0];
  if (firstWord) {
    words[0] = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }

  // Add period
  return words.join(" ") + ".";
}

function generateParagraph(
  minSentences: number = 3,
  maxSentences: number = 7
): string {
  const sentenceCount = randomInt(minSentences, maxSentences);
  const sentences: string[] = [];

  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }

  return sentences.join(" ");
}

/**
 * Generates Lorem Ipsum placeholder text.
 */
function execute(input: Input, options?: Options): Output {
  const count = input.count;
  const unit = options?.unit ?? "paragraphs";
  const startWithLorem = options?.startWithLorem ?? true;

  let output: string;

  switch (unit) {
    case "words": {
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(randomWord());
      }
      if (startWithLorem && words.length >= 2) {
        words[0] = "Lorem";
        words[1] = "ipsum";
      }
      output = words.join(" ");
      break;
    }

    case "sentences": {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      if (startWithLorem && sentences.length > 0) {
        sentences[0] = LOREM_START + ".";
      }
      output = sentences.join(" ");
      break;
    }

    case "paragraphs":
    default: {
      const paragraphs: string[] = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      if (startWithLorem && paragraphs.length > 0) {
        const firstPara = paragraphs[0];
        if (firstPara) {
          paragraphs[0] = LOREM_START + ". " + firstPara;
        }
      }
      output = paragraphs.join("\n\n");
    }
  }

  const wordCount = output.split(/\s+/).filter((w) => w.length > 0).length;
  const characterCount = output.length;

  return {
    output,
    wordCount,
    characterCount,
  };
}

/**
 * Lorem Ipsum tool.
 * Generates placeholder text.
 */
export const loremIpsum = defineTool({
  meta: {
    id: "text/lorem-ipsum",
    name: "Lorem Ipsum",
    description:
      "Free online Lorem Ipsum generator — create placeholder text in words, sentences, or paragraphs instantly in your browser. No data is stored. Configurable count, unit type, and optional classic opening.",
    category: "text",
    subgroup: "Generation",
    tier: ToolTier.CLIENT,
    keywords: ["lorem", "ipsum", "placeholder", "dummy", "text"],
    examples: [
      {
        title: "One Paragraph",
        description:
          "Generate a single paragraph of placeholder text (output varies due to randomness)",
        input: { count: 1 },
        output:
          "(Random Lorem Ipsum placeholder text — output varies each run)",
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
