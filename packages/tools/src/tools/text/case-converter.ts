import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Text to convert"),
});

const outputSchema = z.object({
  camelCase: z.string().describe("camelCase format"),
  pascalCase: z.string().describe("PascalCase format"),
  snakeCase: z.string().describe("snake_case format"),
  kebabCase: z.string().describe("kebab-case format"),
  upperCase: z.string().describe("UPPER CASE format"),
  lowerCase: z.string().describe("lower case format"),
  titleCase: z.string().describe("Title Case format"),
  sentenceCase: z.string().describe("Sentence case format"),
  constantCase: z.string().describe("CONSTANT_CASE format"),
  dotCase: z.string().describe("dot.case format"),
  pathCase: z.string().describe("path/case format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function splitWords(text: string): string[] {
  // Handle camelCase, PascalCase, snake_case, kebab-case, spaces
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[_\-./\\]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function toCamelCase(words: string[]): string {
  return words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
}

function toPascalCase(words: string[]): string {
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

function toKebabCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("-");
}

function toTitleCase(words: string[]): string {
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function toSentenceCase(words: string[]): string {
  const sentence = words.map((w) => w.toLowerCase()).join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function toConstantCase(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("_");
}

function toDotCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(".");
}

function toPathCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("/");
}

/**
 * Converts text between various case formats.
 */
function execute(input: Input): Output {
  const words = splitWords(input.input);

  if (words.length === 0) {
    return {
      camelCase: "",
      pascalCase: "",
      snakeCase: "",
      kebabCase: "",
      upperCase: "",
      lowerCase: "",
      titleCase: "",
      sentenceCase: "",
      constantCase: "",
      dotCase: "",
      pathCase: "",
    };
  }

  return {
    camelCase: toCamelCase(words),
    pascalCase: toPascalCase(words),
    snakeCase: toSnakeCase(words),
    kebabCase: toKebabCase(words),
    upperCase: input.input.toUpperCase(),
    lowerCase: input.input.toLowerCase(),
    titleCase: toTitleCase(words),
    sentenceCase: toSentenceCase(words),
    constantCase: toConstantCase(words),
    dotCase: toDotCase(words),
    pathCase: toPathCase(words),
  };
}

/**
 * Case Converter tool.
 * Converts text between camelCase, PascalCase, snake_case, kebab-case, etc.
 */
export const caseConverter = defineTool({
  meta: {
    id: "text/case-converter",
    name: "Case Converter",
    description:
      "Free online case converter — transform text between camelCase, PascalCase, snake_case, kebab-case, and more instantly in your browser. No data is stored. Supports 11 formats including CONSTANT_CASE, dot.case, and path/case.",
    category: "text",
    subgroup: "Transformation",
    tier: ToolTier.CLIENT,
    keywords: ["case", "convert", "camel", "pascal", "snake", "kebab", "title"],
    examples: [
      {
        title: "Variable Name",
        description:
          "Convert a phrase into various programming naming conventions",
        input: "user profile settings",
        output:
          '{"camelCase":"userProfileSettings","pascalCase":"UserProfileSettings","snakeCase":"user_profile_settings","kebabCase":"user-profile-settings","upperCase":"USER PROFILE SETTINGS","lowerCase":"user profile settings","titleCase":"User Profile Settings","sentenceCase":"User profile settings","constantCase":"USER_PROFILE_SETTINGS","dotCase":"user.profile.settings","pathCase":"user/profile/settings"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
