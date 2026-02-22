/* eslint-disable no-console -- build script with expected console output */
/**
 * Build-time OG image generator.
 * Generates 1200x630 PNG images for all tools, categories, and a default fallback.
 *
 * Usage: tsx scripts/generate-og-images.ts
 */
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import {
  getAllTools,
  getAllCategories,
  getCategoryById,
} from "@utils-live/tools";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const WIDTH = 1200;
const HEIGHT = 630;
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(SCRIPT_DIR, "..", "public", "og");

const COLORS = {
  bg: "#0a0a0a",
  accent: "#3b82f6",
  white: "#ffffff",
  gray: "#d1d5db",
  mutedGray: "#9ca3af",
};

// Google Fonts CDN URLs for Inter (TTF format, v20)
const FONT_URLS = {
  regular:
    "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
  bold: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- inferred return type used by satori
async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fetch(FONT_URLS.regular).then((r) => r.arrayBuffer()),
    fetch(FONT_URLS.bold).then((r) => r.arrayBuffer()),
  ]);
  return [
    {
      name: "Inter",
      data: regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- satori element objects
type SatoriElement = any;

// Satori element helpers (object format, not JSX)
function toolTemplate(
  name: string,
  description: string,
  categoryName: string
): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        padding: "60px",
        fontFamily: "Inter",
      },
      children: [
        // Blue accent bar at top
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              backgroundColor: COLORS.accent,
            },
          },
        },
        // Category label
        {
          type: "div",
          props: {
            style: {
              color: COLORS.accent,
              fontSize: "20px",
              fontWeight: 400,
              marginBottom: "12px",
            },
            children: categoryName,
          },
        },
        // Tool name
        {
          type: "div",
          props: {
            style: {
              color: COLORS.white,
              fontSize: "48px",
              fontWeight: 700,
              marginBottom: "20px",
              lineHeight: 1.2,
            },
            children: truncate(name, 60),
          },
        },
        // Description
        {
          type: "div",
          props: {
            style: {
              color: COLORS.gray,
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: "900px",
            },
            children: truncate(description, 140),
          },
        },
        // Spacer
        { type: "div", props: { style: { flex: "1" } } },
        // Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: COLORS.white,
                    fontSize: "28px",
                    fontWeight: 700,
                  },
                  children: "utils.live",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    backgroundColor: COLORS.accent,
                    color: COLORS.white,
                    fontSize: "16px",
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: "8px",
                  },
                  children: "Free Tool",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function categoryTemplate(
  name: string,
  description: string,
  toolCount: number
): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        padding: "60px",
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              backgroundColor: COLORS.accent,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              color: COLORS.accent,
              fontSize: "20px",
              fontWeight: 400,
              marginBottom: "12px",
            },
            children: `${toolCount} Free Tools`,
          },
        },
        {
          type: "div",
          props: {
            style: {
              color: COLORS.white,
              fontSize: "48px",
              fontWeight: 700,
              marginBottom: "20px",
              lineHeight: 1.2,
            },
            children: name,
          },
        },
        {
          type: "div",
          props: {
            style: {
              color: COLORS.gray,
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.5,
              maxWidth: "900px",
            },
            children: truncate(description, 140),
          },
        },
        { type: "div", props: { style: { flex: "1" } } },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: COLORS.white,
                    fontSize: "28px",
                    fontWeight: 700,
                  },
                  children: "utils.live",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    backgroundColor: COLORS.accent,
                    color: COLORS.white,
                    fontSize: "16px",
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: "8px",
                  },
                  children: "Free Online Tools",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function defaultTemplate(toolCount: string): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.bg,
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "4px",
              backgroundColor: COLORS.accent,
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              color: COLORS.white,
              fontSize: "64px",
              fontWeight: 700,
              marginBottom: "16px",
            },
            children: "utils.live",
          },
        },
        {
          type: "div",
          props: {
            style: {
              color: COLORS.gray,
              fontSize: "32px",
              fontWeight: 400,
            },
            children: `${toolCount} Free Developer Tools`,
          },
        },
      ],
    },
  };
}

async function renderPNG(
  element: unknown,
  fonts: Awaited<ReturnType<typeof loadFonts>>
): Promise<Buffer> {
  const svg = await satori(element as React.ReactNode, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } });
  return Buffer.from(resvg.render().asPng());
}

function writeImage(filePath: string, data: Buffer): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, data);
}

async function main(): Promise<void> {
  console.log("Generating OG images...");
  const fonts = await loadFonts();

  const tools = getAllTools();
  const categories = getAllCategories();
  const toolCount = `${Math.floor(tools.length / 50) * 50}+`;

  // 1. Default image
  const defaultPNG = await renderPNG(defaultTemplate(toolCount), fonts);
  writeImage(join(PUBLIC_DIR, "default.png"), defaultPNG);
  console.log("  Generated default.png");

  // 2. Category images
  for (const cat of categories) {
    const catTools = tools.filter((t) => t.meta.category === cat.id);
    const png = await renderPNG(
      categoryTemplate(cat.name, cat.description, catTools.length),
      fonts
    );
    writeImage(join(PUBLIC_DIR, cat.id, "index.png"), png);
  }
  console.log(`  Generated ${categories.length} category images`);

  // 3. Tool images (with progress)
  let count = 0;
  for (const tool of tools) {
    const parts = tool.meta.id.split("/");
    const category = parts[0] ?? "";
    const slug = parts[1] ?? "";
    const catInfo = getCategoryById(category);

    const png = await renderPNG(
      toolTemplate(
        tool.meta.name,
        tool.meta.description,
        catInfo?.name ?? category
      ),
      fonts
    );
    writeImage(join(PUBLIC_DIR, category, `${slug}.png`), png);

    count++;
    if (count % 100 === 0) {
      console.log(`  Generated ${count}/${tools.length} tool images...`);
    }
  }
  console.log(`  Generated ${count}/${tools.length} tool images`);

  const totalFiles = 1 + categories.length + tools.length;
  console.log(`Done! ${totalFiles} OG images generated in public/og/`);
}

main().catch((err) => {
  console.error("OG image generation failed:", err);
  process.exit(1);
});
