import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("My Page Title").describe("OG title"),
  description: z
    .string()
    .default("Description for social sharing")
    .describe("OG description"),
  url: z.string().default("https://example.com").describe("Page URL"),
  image: z
    .string()
    .default("https://example.com/image.jpg")
    .describe("OG image URL"),
  imageWidth: z.number().int().default(1200).describe("Image width"),
  imageHeight: z.number().int().default(630).describe("Image height"),
  type: z
    .enum(["website", "article", "profile", "video.movie", "music.song"])
    .default("website")
    .describe("OG type"),
  siteName: z.string().default("").describe("Site name"),
  locale: z.string().default("en_US").describe("Locale (e.g., en_US)"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Open Graph meta tags"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const tags: string[] = [];

  tags.push(`<meta property="og:title" content="${input.title}">`);
  tags.push(`<meta property="og:description" content="${input.description}">`);
  tags.push(`<meta property="og:url" content="${input.url}">`);
  tags.push(`<meta property="og:type" content="${input.type}">`);
  tags.push(`<meta property="og:image" content="${input.image}">`);
  tags.push(`<meta property="og:image:width" content="${input.imageWidth}">`);
  tags.push(`<meta property="og:image:height" content="${input.imageHeight}">`);
  tags.push(`<meta property="og:locale" content="${input.locale}">`);

  if (input.siteName) {
    tags.push(`<meta property="og:site_name" content="${input.siteName}">`);
  }

  return { output: tags.join("\n") };
}

export const ogGenerator = defineTool({
  meta: {
    id: "web/og-generator",
    name: "Open Graph Generator",
    description:
      "Free online Open Graph meta tag generator — create og: meta tags for rich social media previews on Facebook, LinkedIn, and more instantly in your browser. No data is stored. Configurable title, description, image dimensions, type, site name, and locale.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "open graph",
      "og",
      "meta",
      "social",
      "facebook",
      "sharing",
      "generator",
      "linkedin",
      "preview",
      "rich-link",
      "image",
      "article",
      "website",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "Article Open Graph tags with site name",
        description:
          "Generate Open Graph meta tags for a blog article with image, site name, and locale",
        input: {
          title: "Building REST APIs with Node.js",
          description:
            "A comprehensive guide to building RESTful APIs using Express and Node.js",
          url: "https://example.com/blog/rest-apis",
          image: "https://example.com/images/rest-api-cover.jpg",
          imageWidth: 1200,
          imageHeight: 630,
          type: "article",
          siteName: "Acme Dev Blog",
          locale: "en_US",
        },
        output:
          '<meta property="og:title" content="Building REST APIs with Node.js">\n<meta property="og:description" content="A comprehensive guide to building RESTful APIs using Express and Node.js">\n<meta property="og:url" content="https://example.com/blog/rest-apis">\n<meta property="og:type" content="article">\n<meta property="og:image" content="https://example.com/images/rest-api-cover.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:locale" content="en_US">\n<meta property="og:site_name" content="Acme Dev Blog">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
