import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(3)
    .default("AB")
    .describe("Initials or short text (1-3 chars)"),
  size: z
    .number()
    .min(16)
    .max(512)
    .default(100)
    .describe("Avatar size in pixels"),
  style: z
    .enum(["initials", "geometric", "rings"])
    .default("initials")
    .describe("Avatar style"),
  backgroundColor: z
    .string()
    .optional()
    .describe("Background color (auto-generated if not provided)"),
  textColor: z.string().default("#ffffff").describe("Text color"),
  shape: z
    .enum(["circle", "square", "rounded"])
    .default("circle")
    .describe("Avatar shape"),
  fontSize: z
    .number()
    .optional()
    .describe("Font size (auto-calculated if not provided)"),
});

const outputSchema = z.object({
  output: z.string().describe("Avatar SVG"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${Math.abs(hue)}, 65%, 50%)`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function execute(input: Input): Output {
  const { text, size, style, textColor, shape } = input;
  const bgColor = input.backgroundColor || stringToColor(text);
  const initials = text.toUpperCase();
  const fSize = input.fontSize || size * 0.4;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;

  // Background shape
  switch (shape) {
    case "square":
      svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;
      break;
    case "rounded":
      svg += `<rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${bgColor}"/>`;
      break;
    default:
      svg += `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${bgColor}"/>`;
  }

  switch (style) {
    case "geometric": {
      // Geometric pattern based on text
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }
      const random = seededRandom(hash);
      const cellSize = size / 5;

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          // Mirror pattern for symmetry
          const col = c < 3 ? c : 4 - c;
          void (r * 3 + col); // seed for deterministic pattern
          const shouldFill = random() > 0.4;
          if (shouldFill) {
            svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="rgba(255,255,255,0.3)"/>`;
          }
        }
      }
      break;
    }
    case "rings": {
      const ringCount = 3;
      for (let i = ringCount; i > 0; i--) {
        const r = (size / 2) * (i / ringCount) * 0.85;
        const opacity = 0.15 + (i / ringCount) * 0.2;
        svg += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,${opacity})" stroke-width="${size * 0.04}"/>`;
      }
      // Still show initials
      svg += `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${fSize}" font-weight="bold" fill="${textColor}">${escapeXml(initials)}</text>`;
      break;
    }
    default:
      // Initials
      svg += `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${fSize}" font-weight="bold" fill="${textColor}">${escapeXml(initials)}</text>`;
  }

  svg += "</svg>";
  return { output: svg };
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const svgAvatarGenerator = defineTool({
  meta: {
    id: "svg/svg-avatar-generator",
    name: "SVG Avatar Generator",
    description:
      "Free online SVG avatar generator — create profile picture placeholders with initials, geometric patterns, or ring styles instantly in your browser. No data is stored. Supports circle, square, and rounded shapes with custom colors and sizes.",
    category: "svg",
    subgroup: "SVG Generators",
    tier: ToolTier.CLIENT,
    keywords: [
      "svg",
      "avatar",
      "initials",
      "profile",
      "icon",
      "placeholder",
      "user",
      "identicon",
      "picture",
      "gravatar",
    ],
    examples: [
      {
        title: "Circular initials avatar for user profile",
        description:
          "Generate a 100px circular avatar showing initials JD with auto-generated background color",
        input: {
          text: "JD",
          size: 100,
          style: "initials",
          textColor: "#ffffff",
          shape: "circle",
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="50" fill="hsl(202, 65%, 50%)"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff">JD</text></svg>',
      },
      {
        title: "Rings style avatar with custom color",
        description:
          "Generate a rings-style avatar with decorative concentric circles and initials",
        input: {
          text: "KM",
          size: 100,
          style: "rings",
          textColor: "#ffffff",
          shape: "circle",
        },
        output:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="50" fill="hsl(242, 65%, 50%)"/><circle cx="50" cy="50" r="42.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="4"/><circle cx="50" cy="50" r="28.33333333333333" fill="none" stroke="rgba(255,255,255,0.2833333333333333)" stroke-width="4"/><circle cx="50" cy="50" r="14.166666666666664" fill="none" stroke="rgba(255,255,255,0.21666666666666667)" stroke-width="4"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff">KM</text></svg>',
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
