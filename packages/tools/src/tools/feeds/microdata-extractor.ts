import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("HTML content containing microdata"),
});

const outputSchema = z.object({
  output: z.string().describe("Extracted microdata as JSON"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

interface MicrodataItem {
  type?: string;
  properties: Record<string, string[]>;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  const html = input.input;
  const items: MicrodataItem[] = [];

  // Extract itemscope blocks
  const itemRegex = /itemscope[^>]*itemtype=["']([^"']*)["']/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(html)) !== null) {
    const type = itemMatch[1]!;
    const item: MicrodataItem = { type, properties: {} };

    // Find itemprop attributes near this itemscope
    const startPos = itemMatch.index;
    // Get the containing element's content (simplified)
    let depth = 0;
    let endPos = startPos;
    let inTag = false;

    for (let i = startPos; i < html.length; i++) {
      if (html[i] === "<") {
        inTag = true;
        if (html[i + 1] === "/") {
          depth--;
          if (depth <= 0) {
            endPos = html.indexOf(">", i) + 1;
            break;
          }
        }
      }
      if (html[i] === ">" && inTag) {
        inTag = false;
        if (html[i - 1] !== "/") {
          depth++;
        }
      }
    }

    if (endPos <= startPos) endPos = Math.min(startPos + 5000, html.length);

    const block = html.substring(startPos, endPos);
    const propRegex = /itemprop=["']([^"']*)["'][^>]*>([^<]*)/gi;
    let propMatch;

    while ((propMatch = propRegex.exec(block)) !== null) {
      const propName = propMatch[1]!;
      let propValue = propMatch[2]!.trim();

      // Try to get content or href attributes
      const fullTag = block.substring(
        propMatch.index,
        block.indexOf(">", propMatch.index) + 1
      );
      const contentMatch = fullTag.match(/content=["']([^"']*)["']/);
      const hrefMatch = fullTag.match(/href=["']([^"']*)["']/);
      const srcMatch = fullTag.match(/src=["']([^"']*)["']/);

      if (contentMatch) propValue = contentMatch[1]!;
      else if (hrefMatch) propValue = hrefMatch[1]!;
      else if (srcMatch) propValue = srcMatch[1]!;

      if (propValue) {
        if (!item.properties[propName]) {
          item.properties[propName] = [];
        }
        item.properties[propName].push(propValue);
      }
    }

    items.push(item);
  }

  // Also extract standalone itemprop without itemscope
  const standaloneItems: Record<string, string[]> = {};
  const standaloneRegex =
    /itemprop=["']([^"']*)["'][^>]*(?:content=["']([^"']*)["']|href=["']([^"']*)["']|>([^<]*))/gi;
  let standaloneMatch;

  while ((standaloneMatch = standaloneRegex.exec(html)) !== null) {
    const propName = standaloneMatch[1]!;
    const value =
      standaloneMatch[2] ||
      standaloneMatch[3] ||
      (standaloneMatch[4] ?? "").trim();
    if (value) {
      if (!standaloneItems[propName]) standaloneItems[propName] = [];
      standaloneItems[propName].push(value);
    }
  }

  const result: Record<string, unknown> = {
    itemsWithScope: items,
    standaloneProperties: standaloneItems,
    totalItems: items.length,
    totalProperties: Object.keys(standaloneItems).length,
  };

  return { output: JSON.stringify(result, null, 2) };
}

export const microdataExtractor = defineTool({
  meta: {
    id: "feeds/microdata-extractor",
    name: "Microdata Extractor",
    description:
      "Free online microdata extractor — paste HTML and extract itemscope, itemtype, and itemprop attributes into structured JSON instantly in your browser. No data is stored. Finds scoped items with properties and standalone itemprop values.",
    category: "feeds",
    subgroup: "Structured Data",
    tier: ToolTier.CLIENT,
    keywords: [
      "microdata",
      "html",
      "extract",
      "schema",
      "itemprop",
      "structured",
      "itemscope",
    ],
    ui: { inputLanguage: "html", outputLanguage: "json" },
    examples: [
      {
        title: "Extract Person microdata from HTML",
        description:
          "Find itemscope and itemprop attributes in an HTML snippet with a Person schema",
        input:
          '<div itemscope itemtype="https://schema.org/Person">\n  <span itemprop="name">Jane Doe</span>\n  <span itemprop="jobTitle">Software Engineer</span>\n</div>',
        output:
          '{"output":"{\\n  \\"itemsWithScope\\": [\\n    {\\n      \\"type\\": \\"https://schema.org/Person\\",\\n      \\"properties\\": {\\n        \\"name\\": [\\n          \\"Jane Doe\\"\\n        ]\\n      }\\n    }\\n  ],\\n  \\"standaloneProperties\\": {\\n    \\"name\\": [\\n      \\"Jane Doe\\"\\n    ],\\n    \\"jobTitle\\": [\\n      \\"Software Engineer\\"\\n    ]\\n  },\\n  \\"totalItems\\": 1,\\n  \\"totalProperties\\": 2\\n}"}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
