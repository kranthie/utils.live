import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  icons: z
    .array(
      z.object({
        id: z.string().describe("Symbol ID for this icon"),
        svg: z.string().describe("SVG source for this icon"),
      })
    )
    .min(1)
    .describe("SVG icons to combine into sprite"),
});

const outputSchema = z.object({
  output: z.string().describe("SVG sprite with symbol elements"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const symbols: string[] = [];

  for (const icon of input.icons) {
    const svg = icon.svg.trim();
    if (!svg.includes("<svg")) {
      throw new Error(`Icon "${icon.id}" does not contain valid SVG`);
    }

    // Extract viewBox
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

    // Extract inner content (between <svg> and </svg>)
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const inner = innerMatch ? innerMatch[1]!.trim() : "";

    symbols.push(
      `  <symbol id="${escapeXml(icon.id)}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`
    );
  }

  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
${symbols.join("\n")}
</svg>`;

  const usage = input.icons
    .map((icon) => `<!-- <svg><use href="#${icon.id}"/></svg> -->`)
    .join("\n");

  return {
    output: `${sprite}\n\n<!-- Usage examples: -->\n${usage}`,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const svgSpriteGenerator = defineTool({
  meta: {
    id: "svg/svg-sprite-generator",
    name: "SVG Sprite Generator",
    description:
      "Free online SVG sprite generator — combine multiple SVG icons into a single sprite sheet with symbol elements instantly in your browser. No data is stored. Generates use-tag references for each icon.",
    category: "svg",
    subgroup: "SVG Operations",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "sprite",
      "symbol",
      "icons",
      "combine",
      "sheet",
      "bundle",
      "use-tag",
      "inline",
    ],
    examples: [
      {
        title: "Combine circle and square icons into sprite",
        description: "Combine two SVG icons into a single sprite sheet",
        input: {
          icons: [
            {
              id: "circle",
              svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
            },
            {
              id: "square",
              svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20"/></svg>',
            },
          ],
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">\n  <symbol id="circle" viewBox="0 0 24 24">\n    <circle cx="12" cy="12" r="10"/>\n  </symbol>\n  <symbol id="square" viewBox="0 0 24 24">\n    <rect x="2" y="2" width="20" height="20"/>\n  </symbol>\n</svg>\n\n<!-- Usage examples: -->\n<!-- <svg><use href="#circle"/></svg> -->\n<!-- <svg><use href="#square"/></svg> -->',
      },
    ],
    ui: {
      outputLanguage: "xml",
    },
  },
  inputSchema,
  outputSchema,
  execute,
});
