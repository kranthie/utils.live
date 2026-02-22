import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input1: z.string().describe("First feed (JSON with items/entries array)"),
  input2: z.string().describe("Second feed (JSON with items/entries array)"),
});

const outputSchema = z.object({
  original: z.string().describe("First feed info"),
  modified: z.string().describe("Second feed info"),
  output: z.string().describe("Merged feed entries as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function getEntries(
  feed: Record<string, unknown>
): Array<Record<string, unknown>> {
  if (Array.isArray(feed.items))
    return feed.items as Array<Record<string, unknown>>;
  if (Array.isArray(feed.entries))
    return feed.entries as Array<Record<string, unknown>>;
  if (Array.isArray(feed))
    return feed as unknown as Array<Record<string, unknown>>;
  return [];
}

function getDateValue(entry: Record<string, unknown>): number {
  const dateStr = (entry.pubDate ??
    entry.updated ??
    entry.published ??
    entry.date) as string | undefined;
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

function getFeedInfo(feed: Record<string, unknown>): string {
  const title = (feed.title as string) ?? "Untitled";
  const entries = getEntries(feed);
  return `${title} (${entries.length} entries)`;
}

function execute(input: Input): Output {
  if (!input.input1.trim() || !input.input2.trim()) {
    throw new Error("Both inputs are required");
  }

  let feed1: Record<string, unknown>;
  let feed2: Record<string, unknown>;

  try {
    feed1 = JSON.parse(input.input1) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in first input");
  }

  try {
    feed2 = JSON.parse(input.input2) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON in second input");
  }

  const entries1 = getEntries(feed1);
  const entries2 = getEntries(feed2);

  // Merge and deduplicate
  const seen = new Set<string>();
  const merged: Array<Record<string, unknown>> = [];

  for (const entry of [...entries1, ...entries2]) {
    const key = (entry.guid ??
      entry.id ??
      entry.link ??
      entry.title ??
      JSON.stringify(entry)) as string;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(entry);
    }
  }

  // Sort by date (newest first)
  merged.sort((a, b) => getDateValue(b) - getDateValue(a));

  const result: Record<string, unknown> = {
    title: `${(feed1.title as string) ?? "Feed 1"} + ${(feed2.title as string) ?? "Feed 2"}`,
    mergedAt: new Date().toISOString(),
    totalEntries: merged.length,
    entries: merged,
  };

  return {
    original: getFeedInfo(feed1),
    modified: getFeedInfo(feed2),
    output: JSON.stringify(result, null, 2),
  };
}

export const feedMerger = defineTool({
  meta: {
    id: "feeds/feed-merger",
    name: "Feed Merger",
    description:
      "Free online feed merger — combine entries from two JSON feeds, deduplicate by ID/link, and sort by date instantly in your browser. No data is stored. Accepts feeds with items or entries arrays and merges them into a unified list.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "feed",
      "merge",
      "combine",
      "rss",
      "atom",
      "deduplicate",
      "json",
    ],
    ui: { outputRenderer: "code", outputLanguage: "json" },
    examples: [
      {
        title: "Merge two blog feeds",
        description:
          "Combine entries from two JSON feeds and deduplicate by entry ID",
        input: {
          input1: '{"title":"Blog A","items":[{"title":"Post 1","id":"1"}]}',
          input2: '{"title":"Blog B","items":[{"title":"Post 2","id":"2"}]}',
        },
        output: "Merged feed with 2 entries",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
