import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  type: z
    .enum([
      "npm",
      "license",
      "build",
      "coverage",
      "version",
      "downloads",
      "stars",
      "custom",
    ])
    .describe("Badge type"),
});

const optionsSchema = z.object({
  // For npm badges
  packageName: z.string().optional().describe("NPM package name"),
  // For GitHub badges
  owner: z.string().optional().describe("GitHub owner/org"),
  repo: z.string().optional().describe("GitHub repository"),
  // For custom badges
  label: z.string().optional().describe("Custom label"),
  message: z.string().optional().describe("Custom message"),
  color: z.string().default("blue").describe("Badge color"),
  style: z
    .enum(["flat", "flat-square", "plastic", "for-the-badge", "social"])
    .default("flat")
    .describe("Badge style"),
  // Common
  link: z.string().optional().describe("Link URL for badge"),
});

const outputSchema = z.object({
  markdown: z.string().describe("Markdown badge code"),
  imageUrl: z.string().describe("Badge image URL"),
});

type Input = z.infer<typeof inputSchema>;
type Options = z.infer<typeof optionsSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Generates badge URLs and markdown.
 */
function execute(input: Input, options?: Options): Output {
  const style = options?.style ?? "flat";
  let imageUrl: string;
  let link: string | undefined = options?.link;

  switch (input.type) {
    case "npm":
      imageUrl = `https://img.shields.io/npm/v/${options?.packageName ?? "package"}?style=${style}`;
      link =
        link ??
        `https://www.npmjs.com/package/${options?.packageName ?? "package"}`;
      break;
    case "license":
      imageUrl = `https://img.shields.io/github/license/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}?style=${style}`;
      break;
    case "build":
      imageUrl = `https://img.shields.io/github/actions/workflow/status/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}/ci.yml?style=${style}`;
      break;
    case "coverage":
      imageUrl = `https://img.shields.io/codecov/c/github/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}?style=${style}`;
      break;
    case "version":
      imageUrl = `https://img.shields.io/github/v/release/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}?style=${style}`;
      break;
    case "downloads":
      if (options?.packageName) {
        imageUrl = `https://img.shields.io/npm/dm/${options.packageName}?style=${style}`;
      } else {
        imageUrl = `https://img.shields.io/github/downloads/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}/total?style=${style}`;
      }
      break;
    case "stars":
      imageUrl = `https://img.shields.io/github/stars/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}?style=${style}`;
      link =
        link ??
        `https://github.com/${options?.owner ?? "owner"}/${options?.repo ?? "repo"}`;
      break;
    case "custom":
    default: {
      const label = encodeURIComponent(options?.label ?? "label");
      const message = encodeURIComponent(options?.message ?? "message");
      const color = options?.color ?? "blue";
      imageUrl = `https://img.shields.io/badge/${label}-${message}-${color}?style=${style}`;
      break;
    }
  }

  const markdown = link
    ? `[![${input.type}](${imageUrl})](${link})`
    : `![${input.type}](${imageUrl})`;

  return { markdown, imageUrl };
}

/**
 * Badge Generator tool.
 * Generates shields.io badge markdown.
 */
export const badgeGenerator = defineTool({
  meta: {
    id: "markdown/badge-generator",
    name: "Badge Generator",
    description:
      "Free online badge generator — create shields.io badge markdown for npm, GitHub, license, build status, and custom badges instantly in your browser. No data is stored. Supports flat, square, plastic, for-the-badge, and social styles.",
    category: "markdown",
    subgroup: "Additional",
    tier: ToolTier.CLIENT,
    keywords: ["markdown", "badge", "shields", "readme", "github"],
    examples: [
      {
        title: "Generate an npm version badge",
        description: "Create a shields.io badge for an npm package",
        input: { type: "npm" },
        output:
          '{\n  "markdown": "[![npm](https://img.shields.io/npm/v/package?style=flat)](https://www.npmjs.com/package/package)",\n  "imageUrl": "https://img.shields.io/npm/v/package?style=flat"\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  optionsSchema,
  execute,
});
