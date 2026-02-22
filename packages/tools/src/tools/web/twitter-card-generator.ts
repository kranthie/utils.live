import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  card: z
    .enum(["summary", "summary_large_image", "app", "player"])
    .default("summary_large_image")
    .describe("Card type"),
  title: z.string().default("My Page Title").describe("Card title"),
  description: z
    .string()
    .default("Description for Twitter card")
    .describe("Card description"),
  image: z
    .string()
    .default("https://example.com/image.jpg")
    .describe("Card image URL"),
  site: z.string().default("").describe("Twitter @username of the site"),
  creator: z
    .string()
    .default("")
    .describe("Twitter @username of the content creator"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated Twitter Card meta tags"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const tags: string[] = [];

  tags.push(`<meta name="twitter:card" content="${input.card}">`);
  tags.push(`<meta name="twitter:title" content="${input.title}">`);
  tags.push(`<meta name="twitter:description" content="${input.description}">`);
  tags.push(`<meta name="twitter:image" content="${input.image}">`);

  if (input.site) {
    const site = input.site.startsWith("@") ? input.site : `@${input.site}`;
    tags.push(`<meta name="twitter:site" content="${site}">`);
  }

  if (input.creator) {
    const creator = input.creator.startsWith("@")
      ? input.creator
      : `@${input.creator}`;
    tags.push(`<meta name="twitter:creator" content="${creator}">`);
  }

  return { output: tags.join("\n") };
}

export const twitterCardGenerator = defineTool({
  meta: {
    id: "web/twitter-card-generator",
    name: "Twitter Card Generator",
    description:
      "Free online Twitter Card meta tag generator — create summary, large image, app, and player card tags for rich social previews instantly in your browser. No data is stored. Configurable card type, image, site handle, and creator handle.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "twitter",
      "card",
      "meta",
      "social",
      "sharing",
      "generator",
      "x",
      "social-media",
      "preview",
      "large-image",
      "handle",
      "summary",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "Large image card with site and creator handles",
        description:
          "Generate Twitter Card tags for a summary_large_image card with @site and @creator handles",
        input: {
          card: "summary_large_image",
          title: "Building REST APIs with Node.js",
          description: "A comprehensive guide to RESTful API development",
          image: "https://example.com/images/rest-api-cover.jpg",
          site: "@acmedev",
          creator: "@janedev",
        },
        output:
          '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="Building REST APIs with Node.js">\n<meta name="twitter:description" content="A comprehensive guide to RESTful API development">\n<meta name="twitter:image" content="https://example.com/images/rest-api-cover.jpg">\n<meta name="twitter:site" content="@acmedev">\n<meta name="twitter:creator" content="@janedev">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
