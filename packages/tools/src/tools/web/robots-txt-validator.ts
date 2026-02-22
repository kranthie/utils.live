import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("robots.txt content to validate"),
});

const outputSchema = z.object({
  output: z.string().describe("Validation result"),
  valid: z.boolean().describe("Whether the robots.txt is valid"),
  errors: z.array(z.string()).describe("Validation errors"),
  warnings: z.array(z.string()).describe("Validation warnings"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

const VALID_DIRECTIVES = new Set([
  "user-agent",
  "disallow",
  "allow",
  "sitemap",
  "crawl-delay",
  "host",
  "clean-param",
  "request-rate",
  "visit-time",
  "noindex",
]);

function execute(input: Input): Output {
  const raw = input.input;
  if (!raw.trim()) {
    throw new Error("Input cannot be empty");
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = raw.split("\n");
  let hasUserAgent = false;
  let hasSitemap = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    const lineNo = i + 1;

    // Skip empty lines and comments
    if (!line || line.startsWith("#")) continue;

    // Parse directive
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) {
      errors.push(`Line ${lineNo}: Invalid format - missing colon separator`);
      continue;
    }

    const directive = line.substring(0, colonIdx).trim().toLowerCase();
    const value = line.substring(colonIdx + 1).trim();

    if (!VALID_DIRECTIVES.has(directive)) {
      warnings.push(`Line ${lineNo}: Unknown directive "${directive}"`);
    }

    switch (directive) {
      case "user-agent":
        hasUserAgent = true;
        if (!value) {
          errors.push(`Line ${lineNo}: User-agent value is empty`);
        }
        break;

      case "disallow":
      case "allow":
        if (!hasUserAgent) {
          errors.push(
            `Line ${lineNo}: "${directive}" must appear after a "User-agent" directive`
          );
        }
        if (value && !value.startsWith("/") && !value.startsWith("*")) {
          warnings.push(
            `Line ${lineNo}: Path "${value}" should start with "/"`
          );
        }
        break;

      case "sitemap":
        hasSitemap = true;
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
          errors.push(
            `Line ${lineNo}: Sitemap URL should start with http:// or https://`
          );
        }
        break;

      case "crawl-delay": {
        const delay = Number(value);
        if (isNaN(delay) || delay < 0) {
          errors.push(
            `Line ${lineNo}: Crawl-delay must be a non-negative number`
          );
        }
        break;
      }
    }
  }

  if (!hasUserAgent) {
    errors.push("No User-agent directive found");
  }

  if (!hasSitemap) {
    warnings.push(
      "No Sitemap directive found - consider adding one for better SEO"
    );
  }

  const valid = errors.length === 0;
  const parts: string[] = [];

  if (valid) {
    parts.push("robots.txt is valid!");
  } else {
    parts.push(`Found ${errors.length} error(s)`);
  }

  if (errors.length > 0) {
    parts.push("\nErrors:");
    parts.push(...errors.map((e) => `  - ${e}`));
  }
  if (warnings.length > 0) {
    parts.push("\nWarnings:");
    parts.push(...warnings.map((w) => `  - ${w}`));
  }

  return { output: parts.join("\n"), valid, errors, warnings };
}

export const robotsTxtValidator = defineTool({
  meta: {
    id: "web/robots-txt-validator",
    name: "robots.txt Validator",
    description:
      "Free online robots.txt validator — check robots.txt syntax, directives, and crawl rules for errors instantly in your browser. No data is stored. Validates User-agent, Disallow, Allow, Sitemap, and Crawl-delay directives.",
    category: "web",
    subgroup: "SEO & Meta",
    tier: ToolTier.CLIENT,
    keywords: [
      "robots.txt",
      "validate",
      "seo",
      "crawl",
      "check",
      "syntax",
      "error",
      "directive",
      "user-agent",
      "disallow",
      "crawl",
    ],
    examples: [
      {
        title: "Validate robots.txt with sitemap directive",
        description:
          "Check a robots.txt file with User-agent, Disallow, and Sitemap directives for syntax errors",
        input:
          "User-agent: *\nDisallow: /admin/\nSitemap: https://example.com/sitemap.xml",
        output: "robots.txt is valid!",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
