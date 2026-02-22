import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  urls: z
    .string()
    .default(
      "en:https://example.com/\nes:https://example.com/es/\nfr:https://example.com/fr/"
    )
    .describe(
      "Language:URL pairs, one per line (e.g., en:https://example.com/)"
    ),
  defaultLang: z
    .string()
    .default("en")
    .describe("Default language code for x-default"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated hreflang tags"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines = input.urls
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error("At least one language:URL pair is required");
  }

  const pairs: { lang: string; url: string }[] = [];
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx <= 0) {
      throw new Error(
        `Invalid format: "${line}". Expected "lang:url" (e.g., "en:https://example.com/")`
      );
    }

    // Handle case where URL contains colons
    const lang = line.substring(0, colonIdx).trim();
    const rest = line.substring(colonIdx + 1).trim();
    // URL starts after the language code
    const urlMatch = rest.match(/^(https?:\/\/.*)$/);
    if (!urlMatch) {
      // Try combining: maybe it's lang:https://... with first colon separating lang
      const fullLine = line;
      const langPart = fullLine.split(":")[0]!.trim();
      const urlPart = fullLine.substring(langPart.length + 1).trim();
      pairs.push({ lang: langPart, url: urlPart });
    } else {
      pairs.push({ lang, url: urlMatch[1]! });
    }
  }

  const tags: string[] = [];
  tags.push("<!-- Hreflang tags -->");

  for (const pair of pairs) {
    tags.push(
      `<link rel="alternate" hreflang="${pair.lang}" href="${pair.url}">`
    );
  }

  // Add x-default
  const defaultUrl =
    pairs.find((p) => p.lang === input.defaultLang)?.url || pairs[0]!.url;
  tags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}">`);

  return { output: tags.join("\n") };
}

export const hreflangGenerator = defineTool({
  meta: {
    id: "web/hreflang-generator",
    name: "Hreflang Generator",
    description:
      "Free online hreflang tag generator — create hreflang link tags for multilingual and multi-regional SEO instantly in your browser. No data is stored. Generates alternate link tags with x-default fallback.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "hreflang",
      "i18n",
      "multilingual",
      "seo",
      "language",
      "generator",
      "alternate",
      "x-default",
      "regional",
      "localization",
      "link-tag",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "English and Spanish alternate page tags",
        description:
          "Generate hreflang tags linking English and Spanish versions of a page with x-default",
        input: {
          urls: "en:https://example.com/\nes:https://example.com/es/",
          defaultLang: "en",
        },
        output:
          '<!-- Hreflang tags -->\n<link rel="alternate" hreflang="en" href="https://example.com/">\n<link rel="alternate" hreflang="es" href="https://example.com/es/">\n<link rel="alternate" hreflang="x-default" href="https://example.com/">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
