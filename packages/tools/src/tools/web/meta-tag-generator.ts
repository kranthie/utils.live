import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  title: z.string().default("My Page Title").describe("Page title"),
  description: z
    .string()
    .default("A brief description of the page content.")
    .describe("Page description (max 160 chars recommended)"),
  keywords: z.string().default("").describe("Comma-separated keywords"),
  author: z.string().default("").describe("Author name"),
  robots: z
    .enum([
      "index,follow",
      "noindex,follow",
      "index,nofollow",
      "noindex,nofollow",
    ])
    .default("index,follow")
    .describe("Robots directive"),
  viewport: z
    .string()
    .default("width=device-width, initial-scale=1.0")
    .describe("Viewport settings"),
  charset: z.string().default("UTF-8").describe("Character encoding"),
  themeColor: z
    .string()
    .default("")
    .describe("Theme color for mobile browsers"),
});

const outputSchema = z.object({
  output: z.string().describe("Generated meta tags"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const tags: string[] = [];

  tags.push(`<meta charset="${input.charset}">`);
  tags.push(`<meta name="viewport" content="${input.viewport}">`);
  tags.push(`<title>${input.title}</title>`);
  tags.push(`<meta name="description" content="${input.description}">`);

  if (input.keywords) {
    tags.push(`<meta name="keywords" content="${input.keywords}">`);
  }

  if (input.author) {
    tags.push(`<meta name="author" content="${input.author}">`);
  }

  tags.push(`<meta name="robots" content="${input.robots}">`);

  if (input.themeColor) {
    tags.push(`<meta name="theme-color" content="${input.themeColor}">`);
  }

  return { output: tags.join("\n") };
}

export const metaTagGenerator = defineTool({
  meta: {
    id: "web/meta-tag-generator",
    name: "Meta Tag Generator",
    description:
      "Free online HTML meta tag generator — create essential meta tags for SEO, viewport, charset, and social discovery instantly in your browser. No data is stored. Configurable title, description, keywords, author, robots directives, and theme color.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "meta",
      "tags",
      "seo",
      "html",
      "generator",
      "description",
      "keywords",
      "title",
      "viewport",
      "charset",
      "robots",
      "author",
      "theme-color",
      "head",
    ],
    ui: {
      outputLanguage: "html",
    },
    examples: [
      {
        title: "Blog page with author and keyword meta tags",
        description:
          "Generate meta tags for a blog page including title, description, keywords, and author",
        input: {
          title: "My Blog - Web Development Tips",
          description:
            "Learn modern web development practices, frameworks, and tools.",
          keywords: "web development, javascript, react",
          author: "Jane Developer",
          robots: "index,follow",
          viewport: "width=device-width, initial-scale=1.0",
          charset: "UTF-8",
          themeColor: "",
        },
        output:
          '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>My Blog - Web Development Tips</title>\n<meta name="description" content="Learn modern web development practices, frameworks, and tools.">\n<meta name="keywords" content="web development, javascript, react">\n<meta name="author" content="Jane Developer">\n<meta name="robots" content="index,follow">',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
