import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const COMMON_PATTERNS: Record<
  string,
  { pattern: string; description: string; example: string }
> = {
  email: {
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    description: "Email address validation",
    example: "user@example.com",
  },
  url: {
    pattern: "^https?:\\/\\/[^\\s/$.?#].[^\\s]*$",
    description: "URL validation (http/https)",
    example: "https://example.com/path",
  },
  ipv4: {
    pattern:
      "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$",
    description: "IPv4 address validation",
    example: "192.168.1.1",
  },
  ipv6: {
    pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$",
    description: "IPv6 address validation (full form)",
    example: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
  },
  phone_us: {
    pattern: "^\\+?1?[-.\\s]?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$",
    description: "US phone number",
    example: "(555) 123-4567",
  },
  phone_intl: {
    pattern:
      "^\\+?\\d{1,4}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}$",
    description: "International phone number (flexible)",
    example: "+44 20 7946 0958",
  },
  date_iso: {
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    description: "ISO 8601 date (YYYY-MM-DD)",
    example: "2024-01-15",
  },
  date_us: {
    pattern: "^(?:0[1-9]|1[0-2])\\/(?:0[1-9]|[12]\\d|3[01])\\/\\d{4}$",
    description: "US date format (MM/DD/YYYY)",
    example: "01/15/2024",
  },
  time_24h: {
    pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$",
    description: "24-hour time format",
    example: "14:30:00",
  },
  hex_color: {
    pattern: "^#?(?:[0-9a-fA-F]{3}){1,2}$",
    description: "Hex color code",
    example: "#FF5733",
  },
  uuid: {
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    description: "UUID format",
    example: "550e8400-e29b-41d4-a716-446655440000",
  },
  slug: {
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    description: "URL slug",
    example: "my-blog-post-title",
  },
  username: {
    pattern: "^[a-zA-Z0-9_-]{3,32}$",
    description: "Username (3-32 chars, alphanumeric, _, -)",
    example: "john_doe123",
  },
  password_strong: {
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$",
    description: "Strong password (8+, upper, lower, digit, special)",
    example: "Str0ng!Pass",
  },
  credit_card: {
    pattern:
      "^(?:4\\d{12}(?:\\d{3})?|5[1-5]\\d{14}|3[47]\\d{13}|6(?:011|5\\d{2})\\d{12})$",
    description: "Major credit card numbers",
    example: "4111111111111111",
  },
  ssn: {
    pattern: "^\\d{3}-\\d{2}-\\d{4}$",
    description: "US Social Security Number format",
    example: "123-45-6789",
  },
  zip_us: {
    pattern: "^\\d{5}(?:-\\d{4})?$",
    description: "US ZIP code",
    example: "90210 or 90210-1234",
  },
  mac_address: {
    pattern: "^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$",
    description: "MAC address",
    example: "00:1A:2B:3C:4D:5E",
  },
  semver: {
    pattern:
      "^\\d+\\.\\d+\\.\\d+(?:-[\\da-zA-Z-]+(?:\\.[\\da-zA-Z-]+)*)?(?:\\+[\\da-zA-Z-]+(?:\\.[\\da-zA-Z-]+)*)?$",
    description: "Semantic version",
    example: "1.2.3-beta.1",
  },
  html_tag: {
    pattern: "<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?<\\/\\1>",
    description: "HTML tag (opening and closing)",
    example: "<div>content</div>",
  },
};

const inputSchema = z.object({
  category: z
    .enum([
      "all",
      "email",
      "url",
      "ipv4",
      "ipv6",
      "phone_us",
      "phone_intl",
      "date_iso",
      "date_us",
      "time_24h",
      "hex_color",
      "uuid",
      "slug",
      "username",
      "password_strong",
      "credit_card",
      "ssn",
      "zip_us",
      "mac_address",
      "semver",
      "html_tag",
    ])
    .default("all")
    .describe("Pattern category to show"),
});

const outputSchema = z.object({
  output: z.string().describe("Common regex patterns"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function execute(input: Input): Output {
  const lines: string[] = [];

  if (input.category === "all") {
    lines.push("=== Common Regex Patterns ===\n");
    for (const [key, val] of Object.entries(COMMON_PATTERNS)) {
      lines.push(`${key}:`);
      lines.push(`  Description: ${val.description}`);
      lines.push(`  Pattern:     ${val.pattern}`);
      lines.push(`  Example:     ${val.example}`);
      lines.push("");
    }
  } else {
    const val = COMMON_PATTERNS[input.category];
    if (!val) throw new Error(`Unknown category: ${input.category}`);
    lines.push(`${input.category}:`);
    lines.push(`  Description: ${val.description}`);
    lines.push(`  Pattern:     ${val.pattern}`);
    lines.push(`  Example:     ${val.example}`);
  }

  return { output: lines.join("\n") };
}

export const commonPatterns = defineTool({
  meta: {
    id: "regex/common-patterns",
    name: "Common Regex Patterns",
    description:
      "Free online regex pattern library — browse common regular expression patterns for email, URL, IP, phone, date, UUID, and more instantly in your browser. No data is stored. Ready-to-use patterns with descriptions and test examples.",
    category: "regex",
    subgroup: "Pattern Library",
    tier: ToolTier.CLIENT,
    keywords: [
      "regex",
      "common",
      "patterns",
      "library",
      "reference",
      "cheatsheet",
      "cookbook",
      "snippets",
    ],
    examples: [
      {
        title: "Email validation regex pattern",
        description: "Get the regex pattern for validating email addresses",
        input: "email",
        output:
          "email:\n  Description: Email address validation\n  Pattern:     ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\n  Example:     user@example.com",
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
