import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("XML sitemap content to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the sitemap is valid"),
  errors: z.array(z.string()).describe("Validation errors"),
  urlCount: z.number().describe("Number of URLs found"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const errors: string[] = [];

  // Check XML declaration
  if (!raw.trim().startsWith("<?xml")) {
    errors.push(
      'Missing XML declaration (<?xml version="1.0" encoding="UTF-8"?>)'
    );
  }

  // Check for urlset root element
  if (!/<urlset\b/.test(raw)) {
    errors.push("Missing <urlset> root element");
  }

  // Check namespace
  if (!raw.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) {
    errors.push(
      "Missing sitemap namespace (http://www.sitemaps.org/schemas/sitemap/0.9)"
    );
  }

  // Extract URLs
  const urlMatches = raw.match(/<url>[\s\S]*?<\/url>/g) || [];
  const urlCount = urlMatches.length;

  if (urlCount === 0) {
    errors.push("No <url> entries found");
  }

  if (urlCount > 50000) {
    errors.push(`Too many URLs (${urlCount}). Maximum is 50,000 per sitemap`);
  }

  // Validate each URL entry
  for (let i = 0; i < urlMatches.length; i++) {
    const entry = urlMatches[i]!;
    const idx = i + 1;

    // Check for <loc>
    const locMatch = entry.match(/<loc>([^<]*)<\/loc>/);
    if (!locMatch) {
      errors.push(`URL #${idx}: Missing required <loc> element`);
    } else {
      const loc = locMatch[1]!.trim();
      if (!loc.startsWith("http://") && !loc.startsWith("https://")) {
        errors.push(
          `URL #${idx}: <loc> must be a full URL starting with http(s)://`
        );
      }
    }

    // Check changefreq if present
    const freqMatch = entry.match(/<changefreq>([^<]*)<\/changefreq>/);
    if (freqMatch) {
      const validFreqs = [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ];
      if (!validFreqs.includes(freqMatch[1]!.trim())) {
        errors.push(
          `URL #${idx}: Invalid <changefreq> value "${freqMatch[1]!.trim()}"`
        );
      }
    }

    // Check priority if present
    const priorityMatch = entry.match(/<priority>([^<]*)<\/priority>/);
    if (priorityMatch) {
      const priority = parseFloat(priorityMatch[1]!.trim());
      if (isNaN(priority) || priority < 0 || priority > 1) {
        errors.push(`URL #${idx}: <priority> must be between 0.0 and 1.0`);
      }
    }
  }

  const valid = errors.length === 0;
  const parts: string[] = [];

  if (valid) {
    parts.push(`Sitemap is valid! Found ${urlCount} URL(s).`);
  } else {
    parts.push(`Found ${errors.length} error(s) in ${urlCount} URL(s)`);
    parts.push("\nErrors:");
    parts.push(...errors.map((e) => `  - ${e}`));
  }

  return { output: parts.join("\n"), valid, errors, urlCount };
}

export const sitemapValidator = defineTool({
  meta: {
    id: "web/sitemap-validator",
    name: "Sitemap Validator",
    description:
      "Free online XML sitemap validator — check sitemap.xml structure, URL entries, and namespace declarations for errors instantly in your browser. No data is stored. Validates loc, changefreq, priority, and URL count limits.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "sitemap",
      "xml",
      "validate",
      "seo",
      "check",
      "structure",
      "url",
      "namespace",
      "loc",
      "error",
      "google",
    ],
    ui: {
      inputLanguage: "xml",
    },
    examples: [
      {
        title: "Validate a minimal XML sitemap",
        description:
          "Check a single-URL XML sitemap for structural correctness",
        input:
          '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n</urlset>',
        output: "Sitemap is valid! Found 1 URL(s).",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
