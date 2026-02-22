import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z
    .string()
    .max(2)
    .default("A")
    .describe("Text to display (1-2 characters)"),
  backgroundColor: z
    .string()
    .default("#4a90d9")
    .describe("Background color (hex)"),
  textColor: z.string().default("#ffffff").describe("Text color (hex)"),
  fontSize: z
    .number()
    .int()
    .min(8)
    .max(64)
    .default(32)
    .describe("Font size in pixels"),
  shape: z
    .enum(["square", "circle", "rounded"])
    .default("rounded")
    .describe("Favicon shape"),
  size: z
    .number()
    .int()
    .min(16)
    .max(512)
    .default(64)
    .describe("Favicon size in pixels"),
});

const outputSchema = z.object({
  output: z.string().describe("SVG favicon markup"),
  linkTag: z.string().describe("HTML link tag for the favicon"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const { text, backgroundColor, textColor, fontSize, shape, size } = input;

  let shapeElement: string;
  const half = size / 2;
  const radius =
    shape === "circle" ? half : shape === "rounded" ? size * 0.15 : 0;

  if (shape === "circle") {
    shapeElement = `<circle cx="${half}" cy="${half}" r="${half}" fill="${backgroundColor}"/>`;
  } else {
    shapeElement = `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${backgroundColor}"/>`;
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  ${shapeElement}`,
    `  <text x="${half}" y="${half}" fill="${textColor}" font-size="${fontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="central">${text}</text>`,
    `</svg>`,
  ].join("\n");

  // Create data URI for link tag
  const encoded = encodeURIComponent(svg);
  const dataUri = `data:image/svg+xml,${encoded}`;
  const linkTag = `<link rel="icon" type="image/svg+xml" href="${dataUri}">`;

  return { output: svg, linkTag };
}

export const faviconGenerator = defineTool({
  meta: {
    id: "html/favicon-generator",
    name: "Favicon Generator",
    description:
      "Free online favicon generator — create text-based SVG favicons instantly in your browser. No data is stored. Customizable text, colors, shape (square, circle, rounded), size, and generates a ready-to-use HTML link tag.",
    category: "html",
    tier: ToolTier.CLIENT,
    keywords: [
      "favicon",
      "icon",
      "generator",
      "svg",
      "html",
      "link tag",
      "website icon",
      "browser tab",
      "text icon",
    ],
    examples: [
      {
        title: "Rounded letter favicon",
        description:
          "Create a blue rounded SVG favicon with letter K for a website",
        input: {
          text: "K",
          backgroundColor: "#4a90d9",
          textColor: "#ffffff",
          fontSize: 32,
          shape: "rounded",
          size: 64,
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">\n  <rect width="64" height="64" rx="9.6" ry="9.6" fill="#4a90d9"/>\n  <text x="32" y="32" fill="#ffffff" font-size="32" font-family="Arial, Helvetica, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="central">K</text>\n</svg>',
      },
    ],
    ui: {
      outputRenderer: "html",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
