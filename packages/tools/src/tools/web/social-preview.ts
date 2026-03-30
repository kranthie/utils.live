import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z
    .string()
    .describe("HTML head content or full HTML page with OG/Twitter meta tags"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML preview of social media sharing cards"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function extractMeta(html: string, name: string): string {
  const patterns = [
    new RegExp(
      `<meta\\s+(?:name|property)\\s*=\\s*["']${name}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\s+content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${name}["']`,
      "i"
    ),
  ];
  for (const regex of patterns) {
    const match = html.match(regex);
    if (match?.[1]) return match[1];
  }
  return "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1] || "";
}

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const ogTitle =
    extractMeta(raw, "og:title") || extractTitle(raw) || "Page Title";
  const ogDesc =
    extractMeta(raw, "og:description") || extractMeta(raw, "description") || "";
  const ogImage = extractMeta(raw, "og:image") || "";
  const ogUrl = extractMeta(raw, "og:url") || "";
  const ogSiteName = extractMeta(raw, "og:site_name") || "";

  const twTitle = extractMeta(raw, "twitter:title") || ogTitle;
  const twDesc = extractMeta(raw, "twitter:description") || ogDesc;
  const twCard = extractMeta(raw, "twitter:card") || "summary_large_image";

  const displayDomain = ogUrl
    ? ogUrl.replace(/^https?:\/\//, "").split("/")[0]
    : "example.com";

  const imgStyle = ogImage
    ? `background-image: url('${ogImage}'); background-size: cover; background-position: center;`
    : "background-color: #e1e8ed; display: flex; align-items: center; justify-content: center;";

  const imgContent = ogImage
    ? ""
    : `<span style="color: #8899a6; font-size: 24px;">No Image</span>`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; padding: 16px;">

  <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #666;">Facebook / Open Graph Preview</h3>
  <div style="border: 1px solid #dadde1; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 24px;">
    <div style="height: 260px; ${imgStyle}">${imgContent}</div>
    <div style="padding: 10px 12px;">
      <div style="font-size: 12px; color: #606770; text-transform: uppercase;">${displayDomain}</div>
      <div style="font-size: 16px; font-weight: 600; color: #1d2129; margin: 4px 0;">${ogTitle}</div>
      <div style="font-size: 14px; color: #606770; line-height: 1.4;">${ogDesc.substring(0, 120)}${ogDesc.length > 120 ? "..." : ""}</div>
    </div>
  </div>

  <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #666;">Twitter Card Preview (${twCard})</h3>
  <div style="border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background: white; margin-bottom: 24px;">
    ${twCard === "summary_large_image" ? `<div style="height: 250px; ${imgStyle}">${imgContent}</div>` : ""}
    <div style="padding: 10px 12px; display: flex; ${twCard === "summary" ? "flex-direction: row" : "flex-direction: column"};">
      ${twCard === "summary" ? `<div style="width: 120px; height: 120px; flex-shrink: 0; margin-right: 10px; border-radius: 8px; ${imgStyle}">${imgContent}</div>` : ""}
      <div>
        <div style="font-size: 15px; font-weight: 700; color: #0f1419;">${twTitle}</div>
        <div style="font-size: 14px; color: #536471; margin: 2px 0; line-height: 1.4;">${twDesc.substring(0, 120)}${twDesc.length > 120 ? "..." : ""}</div>
        <div style="font-size: 13px; color: #536471;">${displayDomain}</div>
      </div>
    </div>
  </div>

  <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #666;">Detected Tags</h3>
  <div style="font-size: 13px; color: #333; line-height: 1.8;">
    og:title: ${ogTitle}<br>
    og:description: ${ogDesc.substring(0, 60)}${ogDesc.length > 60 ? "..." : ""}<br>
    og:image: ${ogImage || "(not set)"}<br>
    og:url: ${ogUrl || "(not set)"}<br>
    og:site_name: ${ogSiteName || "(not set)"}<br>
    twitter:card: ${twCard}<br>
  </div>
</div>`.trim();

  return { output: html };
}

export const socialPreview = defineTool({
  meta: {
    id: "web/social-preview",
    name: "Social Preview",
    description:
      "Free online social media preview — see how your page looks when shared on Facebook and Twitter with Open Graph and Twitter Card analysis instantly in your browser. No data is stored. Shows Facebook card, Twitter card, and detected meta tag values.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "social",
      "preview",
      "og",
      "twitter",
      "facebook",
      "sharing",
      "linkedin",
      "card",
      "meta-tags",
      "image",
      "link-preview",
    ],
    ui: {
      inputLanguage: "html",
      outputRenderer: "html",
    },
    examples: [
      {
        title: "Preview Open Graph sharing card with image",
        description:
          "See how a page with OG title, description, image, and URL appears when shared on Facebook and Twitter",
        input:
          '<meta property="og:title" content="My Blog Post">\n<meta property="og:description" content="A guide to modern web development best practices and tools.">\n<meta property="og:image" content="https://example.com/cover.jpg">\n<meta property="og:url" content="https://example.com/blog/my-post">',
        output: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; padding: 16px;">\n\n  <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #666;">Facebook / Open Graph Preview</h3>\n  <div style="border: 1px solid #dadde1; border-radius: 8px; overflow: hidden; background: white; margin-bottom: 24px;">\n    <div style="height: 260px; background-image: url('https://example.com/cover.jpg'); background-size: cover; background-position: center;"></div>\n    <div style="padding: 10px 12px;">\n      <div style="font-size: 12px; color: #606770; text-transform: uppercase;">example.com</div>\n      <div style="font-size: 16px; font-weight: 600; color: #1d2129; margin: 4px 0;">My Blog Post</div>\n      <div style="font-size: 14px; color: #606770; line-height: 1.4;">A guide to modern web development best practices and tools.</div>\n    </div>\n  </div>\n\n  <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #666;">Twitter Card Preview (summary_large_image)</h3>\n  <div style="border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background: white; margin-bottom: 24px;">\n    <div style="height: 250px; background-image: url('https://example.com/cover.jpg'); background-size: cover; background-position: center;"></div>\n    <div style="padding: 10px 12px; display: flex; flex-direction: column;">\n      \n      <div>\n        <div style="font-size: 15px; font-weight: 700; color: #0f1419;">My Blog Post</div>\n        <div style="font-size: 14px; color: #536471; margin: 2px 0; line-height: 1.4;">A guide to modern web development best practices and tools.</div>\n        <div style="font-size: 13px; color: #536471;">example.com</div>\n      </div>\n    </div>\n  </div>\n\n  <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #666;">Detected Tags</h3>\n  <div style="font-size: 13px; color: #333; line-height: 1.8;">\n    og:title: My Blog Post<br>\n    og:description: A guide to modern web development best practices and tools....<br>\n    og:image: https://example.com/cover.jpg<br>\n    og:url: https://example.com/blog/my-post<br>\n    og:site_name: (not set)<br>\n    twitter:card: summary_large_image<br>\n  </div>\n</div>`,
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
