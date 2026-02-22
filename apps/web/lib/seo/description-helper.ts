import type { ToolMeta } from "@utils-live/tools";

/**
 * Generate an SEO-optimized description for a tool page.
 * Creates ~150 char descriptions from tool metadata.
 */
export function getToolSeoDescription(
  meta: ToolMeta,
  categoryName: string
): string {
  const baseDesc = meta.description.endsWith(".")
    ? meta.description
    : `${meta.description}.`;

  // Pick keywords not already in the description
  const descLower = baseDesc.toLowerCase();
  const uniqueKeywords = meta.keywords
    .filter((k) => !descLower.includes(k.toLowerCase()))
    .slice(0, 3);

  const keywordStr =
    uniqueKeywords.length > 0
      ? ` Free online ${categoryName.toLowerCase()} for ${uniqueKeywords.join(", ")}.`
      : ` Free online ${categoryName.toLowerCase()}.`;

  const suffix = " Runs in your browser — no sign-up required.";

  const full = baseDesc + keywordStr + suffix;
  if (full.length <= 160) return full;

  // Try without keywords
  const shorter =
    baseDesc + ` Free online ${categoryName.toLowerCase()}.` + suffix;
  if (shorter.length <= 160) return shorter;

  // Fallback: base + suffix
  return (baseDesc + suffix).slice(0, 160);
}
