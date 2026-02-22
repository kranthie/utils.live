import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("JSON Feed content"),
});

const outputSchema = z.object({
  output: z.string().describe("Parsed and formatted JSON Feed"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let feed: Record<string, unknown>;
  try {
    feed = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  // Validate JSON Feed format
  const version = feed.version as string | undefined;
  if (!version || !version.startsWith("https://jsonfeed.org/")) {
    throw new Error("Invalid JSON Feed: missing or invalid 'version' field");
  }

  const result: Record<string, unknown> = {
    version: version,
    title: feed.title ?? "Untitled",
  };

  if (feed.home_page_url) result.home_page_url = feed.home_page_url;
  if (feed.feed_url) result.feed_url = feed.feed_url;
  if (feed.description) result.description = feed.description;
  if (feed.icon) result.icon = feed.icon;
  if (feed.favicon) result.favicon = feed.favicon;
  if (feed.language) result.language = feed.language;

  if (feed.authors && Array.isArray(feed.authors)) {
    result.authors = feed.authors;
  } else if (feed.author && typeof feed.author === "object") {
    result.authors = [feed.author];
  }

  const items = feed.items as Array<Record<string, unknown>> | undefined;
  if (items && Array.isArray(items)) {
    result.items = items.map((item) => {
      const parsed: Record<string, unknown> = {};
      if (item.id) parsed.id = item.id;
      if (item.url) parsed.url = item.url;
      if (item.external_url) parsed.external_url = item.external_url;
      if (item.title) parsed.title = item.title;
      if (item.content_html) parsed.content_html = item.content_html;
      if (item.content_text) parsed.content_text = item.content_text;
      if (item.summary) parsed.summary = item.summary;
      if (item.image) parsed.image = item.image;
      if (item.banner_image) parsed.banner_image = item.banner_image;
      if (item.date_published) parsed.date_published = item.date_published;
      if (item.date_modified) parsed.date_modified = item.date_modified;
      if (item.language) parsed.language = item.language;
      if (item.tags) parsed.tags = item.tags;
      if (item.authors) parsed.authors = item.authors;
      if (item.attachments) parsed.attachments = item.attachments;
      return parsed;
    });
    result.itemCount = items.length;
  }

  return { output: JSON.stringify(result, null, 2) };
}

export const jsonFeedParser = defineTool({
  meta: {
    id: "feeds/json-feed-parser",
    name: "JSON Feed Parser",
    description:
      "Free online JSON Feed parser — paste a JSON Feed 1.1 document and get a validated, formatted view of feed metadata and items instantly in your browser. No data is stored. Validates the version field, extracts authors, tags, and attachments.",
    category: "feeds",
    subgroup: "RSS & Atom",
    tier: ToolTier.CLIENT,
    keywords: [
      "json",
      "feed",
      "parse",
      "jsonfeed",
      "validate",
      "rss",
      "alternative",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Parse a JSON Feed 1.1 blog feed",
        description:
          "Validate and format a JSON Feed document with one text item",
        input:
          '{"version":"https://jsonfeed.org/version/1.1","title":"My Blog","items":[{"id":"1","content_text":"Hello world","url":"https://example.com/1"}]}',
        output:
          '{"output":"{\\n  \\"version\\": \\"https://jsonfeed.org/version/1.1\\",\\n  \\"title\\": \\"My Blog\\",\\n  \\"items\\": [\\n    {\\n      \\"id\\": \\"1\\",\\n      \\"url\\": \\"https://example.com/1\\",\\n      \\"content_text\\": \\"Hello world\\"\\n    }\\n  ],\\n  \\"itemCount\\": 1\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
