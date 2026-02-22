import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Markdown content to extract images from"),
});

const imageSchema = z.object({
  src: z.string().describe("Image source URL"),
  alt: z.string().describe("Alt text"),
  title: z.string().nullable().describe("Image title (if present)"),
});

const outputSchema = z.object({
  images: z.array(imageSchema).describe("Array of extracted images"),
  count: z.number().describe("Total number of images found"),
  uniqueSrcs: z.array(z.string()).describe("Unique image sources"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface Image {
  src: string;
  alt: string;
  title: string | null;
}

/**
 * Extract all images from markdown content.
 */
function extractImages(markdown: string): Image[] {
  const images: Image[] = [];

  // Match inline images: ![alt](src) or ![alt](src "title")
  const inlineImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let match;

  while ((match = inlineImageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] ?? "",
      src: match[2] ?? "",
      title: match[3] ?? null,
    });
  }

  // Match reference images: ![alt][ref] with [ref]: src "title"
  const refImageRegex = /!\[([^\]]*)\]\[([^\]]*)\]/g;
  const refDefRegex = /^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]*)")?/gm;

  // Build reference definitions map
  const refDefs = new Map<string, { src: string; title: string | null }>();
  while ((match = refDefRegex.exec(markdown)) !== null) {
    const refKey = match[1];
    const refSrc = match[2];
    if (refKey && refSrc) {
      refDefs.set(refKey.toLowerCase(), {
        src: refSrc,
        title: match[3] ?? null,
      });
    }
  }

  // Match reference images and resolve them
  while ((match = refImageRegex.exec(markdown)) !== null) {
    const alt = match[1] ?? "";
    const refText = match[2] || match[1];
    if (refText) {
      const ref = refText.toLowerCase();
      const def = refDefs.get(ref);
      if (def) {
        images.push({
          alt,
          src: def.src,
          title: def.title,
        });
      }
    }
  }

  // Match HTML img tags
  const htmlImgRegex =
    /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*?)["'])?[^>]*(?:title=["']([^"']*?)["'])?[^>]*>/gi;
  while ((match = htmlImgRegex.exec(markdown)) !== null) {
    const htmlSrc = match[1];
    if (htmlSrc) {
      images.push({
        src: htmlSrc,
        alt: match[2] ?? "",
        title: match[3] ?? null,
      });
    }
  }

  // Also match img tags where alt comes before src
  const htmlImgAltFirstRegex =
    /<img[^>]+alt=["']([^"']*?)["'][^>]*src=["']([^"']+)["'][^>]*(?:title=["']([^"']*?)["'])?[^>]*>/gi;
  while ((match = htmlImgAltFirstRegex.exec(markdown)) !== null) {
    // Check if this image was already added by the previous regex
    const src = match[2];
    if (src && !images.some((img) => img.src === src)) {
      images.push({
        src,
        alt: match[1] ?? "",
        title: match[3] ?? null,
      });
    }
  }

  return images;
}

/**
 * Extracts all images from Markdown content.
 */
function execute(input: Input): Output {
  const images = extractImages(input.input);

  const srcs = images.map((img) => img.src);
  const uniqueSrcs = [...new Set(srcs)];

  return {
    images,
    count: images.length,
    uniqueSrcs,
  };
}

/**
 * Markdown Image Extractor tool.
 * Extracts all images from Markdown content.
 */
export const markdownImageExtractor = defineTool({
  meta: {
    id: "markdown/image-extractor",
    name: "Markdown Image Extractor",
    description:
      "Free online Markdown image extractor — find and list all image references including inline images, reference images, and HTML img tags from Markdown documents instantly in your browser. No data is stored. Reports alt text, source URLs, and unique image sources.",
    category: "markdown",
    subgroup: "Core",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "image", "extract", "img", "src", "alt"],
    examples: [
      {
        title: "Extract images from Markdown",
        description: "Find all image references in a Markdown document",
        input:
          "# My Post\n\n![Logo](https://example.com/logo.png)\n\nText with ![icon](./icon.svg).",
        output:
          '{\n  "images": [\n    {\n      "alt": "Logo",\n      "src": "https://example.com/logo.png",\n      "title": null\n    },\n    {\n      "alt": "icon",\n      "src": "./icon.svg",\n      "title": null\n    }\n  ],\n  "count": 2,\n  "uniqueSrcs": [\n    "https://example.com/logo.png",\n    "./icon.svg"\n  ]\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
