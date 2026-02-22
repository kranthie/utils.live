import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON-LD or JSON structured data"),
});

const outputSchema = z.object({
  output: z.string().describe("HTML preview of rich snippet"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let rawInput = input.input.trim();
  const scriptMatch = rawInput.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) rawInput = scriptMatch[1]!.trim();

  let data: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawInput) as Record<string, unknown>;
    data = Array.isArray(parsed)
      ? (parsed[0] as Record<string, unknown>)
      : parsed;
  } catch {
    throw new Error("Invalid JSON input");
  }

  const type = (data["@type"] as string) ?? "Unknown";
  const name = (data.name ??
    data.headline ??
    data.title ??
    "Untitled") as string;
  const description = (data.description ?? data.summary ?? "") as string;
  const url = (data.url ?? "") as string;
  const image = (data.image ?? data.thumbnailUrl ?? "") as
    | string
    | Record<string, unknown>;
  const imageUrl =
    typeof image === "string" ? image : ((image?.url as string) ?? "");

  let html = `<div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; border-radius: 8px; padding: 16px; background: #fff;">\n`;
  html += `  <div style="color: #666; font-size: 12px; margin-bottom: 4px;">${escapeHtml(type)} Rich Snippet Preview</div>\n`;

  if (imageUrl) {
    html += `  <div style="margin-bottom: 8px;"><img src="${escapeHtml(imageUrl)}" alt="" style="max-width: 100%; border-radius: 4px;" /></div>\n`;
  }

  html += `  <div style="font-size: 18px; color: #1a0dab; margin-bottom: 4px;">${escapeHtml(name)}</div>\n`;

  if (url) {
    html += `  <div style="font-size: 13px; color: #006621; margin-bottom: 4px;">${escapeHtml(url)}</div>\n`;
  }

  if (description) {
    const truncated =
      description.length > 160
        ? description.substring(0, 160) + "..."
        : description;
    html += `  <div style="font-size: 14px; color: #545454; margin-bottom: 8px;">${escapeHtml(truncated)}</div>\n`;
  }

  // Type-specific additions
  if (type === "Product" || type === "Offer") {
    const offers = data.offers as Record<string, unknown> | undefined;
    if (offers) {
      const price =
        typeof offers.price === "string" || typeof offers.price === "number"
          ? String(offers.price)
          : "N/A";
      const currency =
        typeof offers.priceCurrency === "string" ? offers.priceCurrency : "";
      html += `  <div style="font-size: 14px; color: #222; font-weight: bold;">Price: ${currency} ${price}</div>\n`;
    }
  }

  if (type === "Recipe") {
    const cookTime = data.cookTime as string | undefined;
    const prepTime = data.prepTime as string | undefined;
    if (cookTime || prepTime) {
      html += `  <div style="font-size: 13px; color: #666;">`;
      if (prepTime) html += `Prep: ${prepTime} `;
      if (cookTime) html += `Cook: ${cookTime}`;
      html += `</div>\n`;
    }
  }

  if (type === "Review") {
    const rating = data.reviewRating as Record<string, unknown> | undefined;
    if (rating) {
      const val = Number(rating.ratingValue ?? 0);
      const stars =
        "★".repeat(Math.round(val)) + "☆".repeat(5 - Math.round(val));
      html += `  <div style="color: #f4b400; font-size: 16px;">${stars} (${val}/5)</div>\n`;
    }
  }

  if (type === "Event") {
    const startDate = data.startDate as string | undefined;
    if (startDate) {
      html += `  <div style="font-size: 13px; color: #666;">Date: ${escapeHtml(startDate)}</div>\n`;
    }
  }

  if (type === "JobPosting") {
    const org = data.hiringOrganization as Record<string, unknown> | undefined;
    if (org?.name) {
      html += `  <div style="font-size: 13px; color: #666;">Company: ${escapeHtml(org.name as string)}</div>\n`;
    }
  }

  html += `</div>`;

  return { output: html };
}

export const richSnippetPreview = defineTool({
  meta: {
    id: "feeds/rich-snippet-preview",
    name: "Rich Snippet Preview",
    description:
      "Free online rich snippet previewer — paste JSON-LD and see how your structured data will appear as a Google rich result instantly in your browser. No data is stored. Supports Article, Product, Recipe, Review, Event, and JobPosting types.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "rich",
      "snippet",
      "preview",
      "schema",
      "seo",
      "google",
      "search",
      "serp",
    ],
    ui: { outputRenderer: "html" },
    examples: [
      {
        title: "Preview Article rich snippet",
        description:
          "See how an Article JSON-LD document renders as a Google search result",
        input:
          '{"@context":"https://schema.org","@type":"Article","name":"Guide to TypeScript","description":"A comprehensive guide to TypeScript for beginners","url":"https://example.com/typescript-guide"}',
        output: "HTML preview of Article rich snippet",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
